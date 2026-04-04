# Supabase Broadcast Notifications Implementation

## Overview
This document describes the real-time notification system for the San3a marketplace using Supabase Broadcast channels. The system notifies customers when fixers place bids and notifies fixers when customers send counter-offers.

## Architecture

### Two-Way Notification Flow

```
FIXER BIDS (Technician → Customer):
1. Fixer submits bid in ServiceProvider.vue
2. Database updates with fixer_price
3. Broadcast sent to bargain-customer-{customerId} channel
4. Customer receives notification in IncomingOffersPage.vue

CUSTOMER COUNTER-OFFERS (Customer → Fixer):
1. Customer sends counter-offer in IncomingOffersPage.vue
2. Database updates with customer_price
3. Broadcast sent to bargain-fixer-{technicianId} channel
4. Fixer receives notification in ServiceProvider.vue
```

## Implementation Details

### Customer-Side (IncomingOffersPage.vue)

#### Subscription Setup
```javascript
// Line 495-525: subscribeToFixerBidNotifications()
const subscribeToFixerBidNotifications = () => {
  if (!customerUserId.value) return

  myBargainChannel.value = supabase
    .channel(`bargain-customer-${customerUserId.value}`)
    .on('broadcast', { event: 'fixer-bid-notification' }, ({ payload }) => {
      // Creates notification: "Fixer [name] sent an offer of X EGP for request #Y"
      // Shows toast + updates notifications array
    })
    .subscribe()
}
```

**Lifecycle:**
- `onMounted()`: Calls `subscribeToFixerBidNotifications()` after fetching data
- `onBeforeUnmount()`: Unsubscribes from `myBargainChannel`

#### Counter-Offer Broadcast
```javascript
// Line 571-587: submitBargain()
const submitBargain = async () => {
  // 1. Updates database with customer_price
  const { data, error: err } = await supabase
    .from('request')
    .update({ customer_price: price })
    .eq('request_id', bargainTarget.value.request_id)
    .select()
  
  // 2. Broadcasts to fixer
  if (target.technician_id) {
    const fixerChannel = supabase.channel(`bargain-fixer-${target.technician_id}`)
    await fixerChannel.send({
      type: 'broadcast',
      event: 'customer-bargain-notification',
      payload: {
        requestId: target.request_id,
        price: price,
      },
    })
    supabase.removeChannel(fixerChannel)
  }
}
```

### Fixer-Side (ServiceProvider.vue)

#### Subscription Setup
```javascript
// Line 796-820: subscribeToCounterOffers()
const subscribeToCounterOffers = () => {
  if (!technicianId.value) return

  myBargainChannel.value = supabase
    .channel(`bargain-fixer-${technicianId.value}`)
    .on('broadcast', { event: 'customer-bargain-notification' }, ({ payload }) => {
      // Creates notification: "Customer sent a counter-offer of X EGP for request #Y"
      // Shows toast + updates notifications array
    })
    .subscribe()
}
```

**Lifecycle:**
- `onMounted()`: Calls `subscribeToCounterOffers()` after fetching technician data
- `onBeforeUnmount()`: Unsubscribes from `myBargainChannel`

#### Fixer Bid Broadcast
```javascript
// Line 672-742: submitOffer()
const submitOffer = async () => {
  // 1. Updates database with fixer_price
  const { data: updatedRequest, error } = await supabase
    .from('request')
    .update({
      fixer_price: normalizedPrice,
      request_status: 'pending',
      technician_id: technicianId.value,
    })
    .eq('request_id', offerTarget.value.request_id)
    .select()
  
  // 2. Broadcasts to customer
  if (offerTarget.value.user_id) {
    const customerChannel = supabase.channel(`bargain-customer-${offerTarget.value.user_id}`)
    await customerChannel.send({
      type: 'broadcast',
      event: 'fixer-bid-notification',
      payload: {
        requestId: offerTarget.value.request_id,
        price: normalizedPrice,
        fixerName: fullName.value,
      },
    })
    supabase.removeChannel(customerChannel)
  }
}
```

## Notification Format

### For Customers (receiving fixer bids)
**Panel Display:**
- **Header:** `Fixer [fixer name]`
- **Message:** `sent an offer of X EGP for request #Y.`
- **Time:** Formatted timestamp
- **Toast:** Generic offer received notification

### For Fixers (receiving customer counter-offers)
**Panel Display:**
- **Header:** `Customer`
- **Message:** `sent a counter-offer of X EGP for request #Y.`
- **Time:** Formatted timestamp
- **Toast:** Generic counter-offer notification

## Database Changes

### No Schema Changes Required
The system uses existing `request` table columns:
- `user_id` - Customer ID (identifies recipient of fixer bids)
- `technician_id` - Fixer ID (identifies recipient of counter-offers)
- `fixer_price` - Bid amount from fixer
- `customer_price` - Counter-offer amount from customer

### RLS Policy Requirements
Existing RLS policies should allow:
- Technically authenticated users to UPDATE their own request rows
- Broadcast is independent of RLS (happens at application level)

## Channel Naming Convention

- **Fixer to Customer:** `bargain-customer-{customerId}`
- **Customer to Fixer:** `bargain-fixer-{technicianId}`

This ensures:
- Notifications are only received by the intended recipient
- No broadcast leakage to other users
- Clean separation of concern

## Benefits of Broadcast Over postgres_changes

1. **No Realtime Publication Config Needed** - Works with standard Supabase setup
2. **Targeted Delivery** - Only the recipient receives the message
3. **Immediate Notification** - Real-time delivery, not dependent on database publication
4. **Simpler Implementation** - No need to watch for database changes
5. **More Reliable** - Direct message delivery rather than event-based detection

## Testing Checklist

- [ ] Customer receives notification when fixer places bid
- [ ] Fixer receives notification when customer sends counter-offer
- [ ] Notifications disappear after tab/page refresh (ephemeral)
- [ ] Toast notifications appear immediately
- [ ] Only intended recipient sees notification (test with multiple users)
- [ ] Notification timestamp is accurate
- [ ] Fixer name displays correctly for fixer bids
- [ ] "Customer" displays for counter-offers

## Potential Improvements

1. **Persistent Notifications:** Store notifications in database for cross-session visibility
2. **Notification Types:** Different icons/colors for different notification types
3. **Notification Actions:** Action buttons directly in notification panel
4. **Read Status:** Persist read status for notifications
5. **Notification History:** Show older notifications from history
