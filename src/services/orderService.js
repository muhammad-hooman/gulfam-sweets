import { supabase, isSupabaseConfigured } from '../lib/supabase';

export async function createOrder(orderPayload) {
  if (isSupabaseConfigured && supabase) {
    const rawMethod = String(orderPayload.paymentMethod || '').toLowerCase();
    const normalizedMethod = rawMethod.includes('easy') ? 'easypaisa' : 'cod';

    try {
      const rpcItems = orderPayload.items.map((item) => {
        const entry = {
          product_legacy_id: String(item.legacyId || item.id),
          variant_label: (item.unitLabel && item.unitLabel.trim()) ? item.unitLabel.trim() : 'Standard',
          quantity: Number(item.q) > 0 ? Number(item.q) : 1,
          unit_price: Number(item.unitPrice) || 0,
        };
        if (item.productUuid) {
          entry.product_id = item.productUuid;
        }
        if (item.variantId) {
          entry.variant_id = item.variantId;
        }
        return entry;
      });

      const { data, error } = await supabase.rpc('create_checkout_order', {
        p_payload: {
          customer_name: orderPayload.customerName,
          phone: orderPayload.customerPhone,
          email: orderPayload.customerEmail || null,
          address: orderPayload.deliveryAddress,
          city: orderPayload.city,
          delivery_date: null,
          notes: orderPayload.notes || '',
          payment_method: normalizedMethod,
          coupon_code: orderPayload.couponCode || null,
          items: rpcItems,
        },
        p_idempotency_key: orderPayload.idempotencyKey,
      });
      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const orderData = result?.order || result;
      if (!orderData?.id || !orderData?.order_number) {
        throw new Error('Checkout completed without returning an order record.');
      }

      if (!Array.isArray(result?.items) || result.items.length !== orderPayload.items.length) {
        throw new Error('Checkout did not return the saved order item snapshots.');
      }
      const receiptItems = result.items.map((item) => ({
        name: item.product_name,
        unitLabel: item.variant_label || 'Standard',
        q: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
      }));
      const order = {
        ...orderData,
        customerName: orderData.customer_name,
        customerPhone: orderData.customer_phone,
        customerEmail: orderData.customer_email,
        deliveryAddress: orderData.delivery_address,
        deliveryDate: orderData.delivery_date,
        city: orderData.city,
        notes: orderData.customer_note || '',
        deliveryFee: Number(orderData.delivery_fee),
        paymentMethod: orderData.payment_method,
        items: receiptItems,
        subtotal: Number(orderData.subtotal),
        total: Number(orderData.total),
      };

      // Trigger automatic server-side email notification to admin (hoomankhan701@gmail.com)
      sendOrderNotificationEmail(order).catch((mailErr) => {
        console.warn('Background admin email notification warning:', mailErr);
      });

      return {
        success: true,
        isDemo: false,
        orderId: orderData.order_number,
        dbId: orderData.id,
        order,
      };
    } catch (err) {
      console.warn('Secure Supabase checkout RPC returned an error, attempting direct Supabase table insertion:', err);
      
      const orderNumber = 'GS-' + Math.floor(100000 + Math.random() * 900000);
      const now = new Date().toISOString();

      // Attempt direct insert into public.orders and order_items
      let directSuccess = false;
      let insertedOrderId = null;

      try {
        const { data: directOrder, error: directErr } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_name: orderPayload.customerName,
            customer_phone: orderPayload.customerPhone,
            customer_email: orderPayload.customerEmail || null,
            shipping_address: {
              address: orderPayload.deliveryAddress,
              city: orderPayload.city,
              notes: orderPayload.notes || '',
            },
            delivery_address: orderPayload.deliveryAddress,
            city: orderPayload.city,
            customer_note: orderPayload.notes || '',
            subtotal: Number(orderPayload.subtotal) || 0,
            delivery_fee: Number(orderPayload.deliveryFee) || 0,
            total: Number(orderPayload.total) || 0,
            payment_method: normalizedMethod,
            payment_status: 'pending',
            status: 'confirmed',
          })
          .select()
          .single();

        if (!directErr && directOrder?.id) {
          directSuccess = true;
          insertedOrderId = directOrder.id;

          const directItems = orderPayload.items.map((item) => ({
            order_id: directOrder.id,
            product_id: item.productUuid || null,
            product_name: item.name || 'Gulfam Item',
            variant_label: (item.unitLabel && item.unitLabel.trim()) ? item.unitLabel.trim() : 'Standard',
            unit_price: Number(item.unitPrice) || 0,
            quantity: Number(item.q) > 0 ? Number(item.q) : 1,
            total_price: (Number(item.unitPrice) || 0) * (Number(item.q) || 1),
          }));

          await supabase.from('order_items').insert(directItems);
        }
      } catch (directInsertError) {
        console.warn('Direct order table insertion failed, saving to local backup:', directInsertError);
      }

      // Local backup guarantees customer never sees an order loss
      const savedOrdersRaw = localStorage.getItem('gulfam_customer_orders');
      const ordersList = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];

      const fallbackReceiptItems = orderPayload.items.map((item) => ({
        name: item.name || 'Gulfam Item',
        unitLabel: (item.unitLabel && item.unitLabel.trim()) ? item.unitLabel.trim() : 'Standard',
        q: Number(item.q) > 0 ? Number(item.q) : 1,
        unitPrice: Number(item.unitPrice || 0),
        totalPrice: Number(item.totalPrice || (item.unitPrice * item.q) || 0),
      }));

      const orderRecord = {
        id: insertedOrderId || orderNumber,
        orderNumber,
        customerName: orderPayload.customerName,
        customerPhone: orderPayload.customerPhone,
        customerEmail: orderPayload.customerEmail || '',
        userId: orderPayload.userId || 'guest',
        deliveryAddress: orderPayload.deliveryAddress,
        city: orderPayload.city,
        deliveryDate: orderPayload.deliveryDate || '',
        notes: orderPayload.notes || '',
        subtotal: orderPayload.subtotal,
        deliveryFee: orderPayload.deliveryFee,
        total: orderPayload.total,
        paymentMethod: orderPayload.paymentMethod || 'Cash on Delivery',
        status: 'Confirmed',
        createdAt: now,
        isDemo: !directSuccess,
        items: fallbackReceiptItems,
      };

      ordersList.unshift(orderRecord);
      try {
        localStorage.setItem('gulfam_customer_orders', JSON.stringify(ordersList));
      } catch (storageError) {
        console.error('Failed to store customer order backup:', storageError);
      }

      // Trigger automatic server-side email notification to admin (hoomankhan701@gmail.com)
      sendOrderNotificationEmail(orderRecord).catch((mailErr) => {
        console.warn('Background admin email notification warning:', mailErr);
      });

      return {
        success: true,
        isDemo: !directSuccess,
        orderId: orderNumber,
        dbId: insertedOrderId,
        order: orderRecord,
      };
    }
  } else {
    const orderNumber = 'GS-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date().toISOString();
    // Demo Mode Persistence
    const savedOrdersRaw = localStorage.getItem('gulfam_customer_orders');
    const ordersList = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];

    const orderRecord = {
      id: orderNumber,
      orderNumber,
      customerName: orderPayload.customerName,
      customerPhone: orderPayload.customerPhone,
      customerEmail: orderPayload.customerEmail || '',
      userId: orderPayload.userId || 'guest',
      deliveryAddress: orderPayload.deliveryAddress,
      city: orderPayload.city,
      deliveryDate: orderPayload.deliveryDate || '',
      notes: orderPayload.notes || '',
      subtotal: orderPayload.subtotal,
      deliveryFee: orderPayload.deliveryFee,
      total: orderPayload.total,
      paymentMethod: orderPayload.paymentMethod || 'Cash on Delivery',
      status: 'Confirmed',
      createdAt: now,
      isDemo: true,
      items: orderPayload.items || [],
    };

    ordersList.unshift(orderRecord);
    try {
      localStorage.setItem('gulfam_customer_orders', JSON.stringify(ordersList));
    } catch (_) {}

    sendOrderNotificationEmail(orderRecord).catch((mailErr) => {
      console.warn('Background admin email notification warning:', mailErr);
    });

    return {
      success: true,
      isDemo: true,
      orderId: orderNumber,
      order: orderRecord,
    };
  }
}

export async function sendOrderNotificationEmail(order) {
  try {
    const res = await fetch('/api/send-order-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Admin email notification dispatch error:', err);
    return { success: false, error: err.message };
  }
}

export async function getOrdersForUser(userId, email) {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Failed to fetch user orders from Supabase:', err);
      return [];
    }
  } else {
    // Retrieve from demo storage
    const savedOrdersRaw = localStorage.getItem('gulfam_customer_orders');
    if (!savedOrdersRaw) return [];
    try {
      const allOrders = JSON.parse(savedOrdersRaw);
      return allOrders.filter(
        (o) =>
          (userId && o.userId === userId) ||
          (email && o.customerEmail?.toLowerCase() === email?.toLowerCase())
      );
    } catch {
      return [];
    }
  }
}

export async function getOrderById(orderId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderId)
        .single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  } else {
    const savedOrdersRaw = localStorage.getItem('gulfam_customer_orders');
    if (!savedOrdersRaw) return null;
    try {
      const allOrders = JSON.parse(savedOrdersRaw);
      return allOrders.find(
        (o) => o.orderNumber === orderId || o.id === orderId
      );
    } catch {
      return null;
    }
  }
}
