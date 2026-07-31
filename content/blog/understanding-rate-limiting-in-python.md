+++
title = "Understanding Rate Limiting"
date = 2026-07-30
slug = "rate-limit"
description = "A beginner-friendly guide to rate limiting: why you need it, how to track users, and how the 4 main algorithms work with real-world analogies."

[taxonomies]
tags = ["backend", "system-design", "rate-limiting"]
+++

Imagine you open a small coffee shop. Usually, customers walk in one by one, order a drink, and leave. Everything runs smoothly.

Now imagine someone walks in and places 500 orders at once. Your baristas get overwhelmed, the line spills onto the street, and regular customers leave because they can't even get a single cup of coffee.

On the web, your server is the coffee shop, and incoming requests are the orders. **Rate limiting** is like putting a rule at the door: *"Each customer can only place 5 orders per minute."*

Rate limiting protects your website from three big problems:
- **Server Crashes**: Stopping a single script or bot from overloading your server.
- **Password Attacks**: Blocking bots trying thousands of passwords on your `/login` page.
- **Unfairness**: Stopping one heavy user from slowing down the app for everyone else.

---

## Choosing the Right Key: Who Are You Rate Limiting?

Before you can limit requests, you need to answer a basic question: **Who is making the request?**

In rate limiting, we use a **key** (a unique label) to count requests for each person. Here are the 4 common ways to identify users:

### 1. IP Address (For Public Pages)
When a user visits a public page like `/login` or `/register`, they are not logged in yet. The easiest label to use is their **IP address** — the unique address of their internet connection.

```text
Key format: ip:203.0.113.195
```

**The Catch (The Shared Wi-Fi Problem):**
If 50 students use the same university Wi-Fi, they all share one public IP address. If one student sends too many requests, your server might accidentally block all 50 students! 

Use IP tracking for public pages before login, but avoid relying on it for logged-in users.

### 2. User ID (For Logged-in Users)
Once a user logs into their account, track requests using their unique **User ID**.

```text
Key format: user:8492
```

This is much fairer. Two people on the same Wi-Fi now have separate limits, so one person won't block the other.

### 3. User ID + Feature Name (For Heavy Features)
Some features are light (like viewing a profile page), while others are heavy (like generating an AI image).

You can combine the User ID with the feature name so heavy features have their own smaller limit:

```text
Key format: user:8492:feature:generate-image
```

This prevents a user from spending their quota on light requests while keeping heavy features safe.

### 4. API Keys (For Developers)
If you build an API for other developers, give each developer a unique secret key:

```text
Key format: apikey:sk_live_9f8a3c...
```

API keys make it easy to set up account tiers (such as 1,000 requests per day for free accounts versus 100,000 requests per day for paid plans).

---

## The 4 Rate Limiting Algorithms Made Simple

Now that we know *who* we are tracking, let's look at *how* to enforce the limits.

### 1. Fixed Window (The Wall Clock Method)

**Real-world analogy:** Imagine a counter that resets every minute when the clock second hand hits `:00`.

Time is split into fixed 60-second boxes (12:00 to 12:01, 12:01 to 12:02). Each user gets a counter that goes up by one with every request in that window. When a new minute starts, the counter resets to zero.

```python
import time

class FixedWindowLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit  # e.g. 5 requests
        self.window_seconds = window_seconds  # e.g. 60 seconds
        self.counters = {}  # Stores: user_id -> (count, window_start_time)

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        # Find which 60-second window we are in
        current_window = int(now // self.window_seconds)

        count, window_start = self.counters.get(user_id, (0, current_window))

        # Reset count to 0 if a new minute started
        if current_window > window_start:
            count = 0
            window_start = current_window

        # Block if limit is reached
        if count >= self.limit:
            return False

        # Add 1 to count and allow request
        self.counters[user_id] = (count + 1, window_start)
        return True
```

- **Why it's great:** Super fast and uses almost no memory (just one number per user).
- **The downside (Window Spikes):** If a user sends 5 requests at 12:00:59, and 5 more at 12:01:00, your server processes 10 requests in just 1 second! The clock reset allowed a short burst.

---

### 2. Sliding Window Log (The Rolling Timer)

**Real-world analogy:** Instead of checking a wall clock, you look back at your watch to see how many requests happened in the last 60 seconds from *right now*.

Every time a request comes in, you write down the exact timestamp. You clean out timestamps older than 60 seconds, then count how many are left.

```python
import time
from collections import defaultdict

class SlidingWindowLogLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        # Stores: user_id -> list of timestamps [12:00:05, 12:00:15, ...]
        self.logs = defaultdict(list)

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        cutoff_time = now - self.window_seconds

        # Remove timestamps older than 60 seconds
        self.logs[user_id] = [ts for ts in self.logs[user_id] if ts > cutoff_time]

        # Block if limit is reached
        if len(self.logs[user_id]) >= self.limit:
            return False

        # Add current timestamp and allow request
        self.logs[user_id].append(now)
        return True
```

- **Why it's great:** Completely stops the window spike problem because it always checks the exact last 60 seconds.
- **The downside:** High memory use! If a user makes 10,000 requests, you have to store 10,000 timestamps in memory.

---

### 3. Token Bucket (The Game Arcade Pass)

**Real-world analogy:** Imagine a bucket filled with arcade tokens. Every request costs 1 token. Every second, 1 new token drops into the bucket until it is full.

If you have tokens in your bucket, you can spend them immediately. If you stop making requests for a while, your bucket fills back up to full capacity.

```python
import time

class TokenBucketLimiter:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity  # Max tokens bucket can hold (e.g. 5)
        self.refill_rate = refill_rate  # Tokens added per second (e.g. 1.0)
        self.buckets = {}  # Stores: user_id -> (current_tokens, last_update_time)

    def allow_request(self, user_id: str) -> bool:
        now = time.time()
        tokens, last_update = self.buckets.get(user_id, (self.capacity, now))

        # Add new tokens based on time passed
        time_passed = now - last_update
        new_tokens = time_passed * self.refill_rate
        tokens = min(self.capacity, tokens + new_tokens)

        # Block if less than 1 token is available
        if tokens < 1.0:
            self.buckets[user_id] = (tokens, now)
            return False

        # Spend 1 token and allow request
        self.buckets[user_id] = (tokens - 1.0, now)
        return True
```

- **Why it's great:** Matches real human behavior! It allows short, natural bursts (like clicking 3 buttons quickly), while keeping overall usage under control.
- **The downside:** Requires keeping track of both token count and last update time for each user.

---

### 4. Leaky Bucket (The Water Funnel)

**Real-world analogy:** Imagine a funnel with a small hole at the bottom. Water (requests) can be poured into the top quickly, but water drips out the bottom at a steady, constant rate. If you pour water too fast and the funnel fills to the top, extra water spills over (and gets blocked).

Requests enter a waiting line (queue). A background process handles one request at a steady interval. If the queue is full, new requests are rejected immediately.

```python
from queue import Queue, Full

class LeakyBucketLimiter:
    def __init__(self, capacity: int):
        self.capacity = capacity  # Max queue length (e.g. 5)
        self.queue = Queue(maxsize=capacity)

    def add_request(self, request_id: str) -> bool:
        try:
            # Try to add request to queue
            self.queue.put_nowait(request_id)
            return True
        except Full:
            # Line is full, drop request
            return False
```

- **Why it's great:** Perfect for turning wild traffic spikes into a smooth, steady stream of work.
- **The downside:** Does not allow fast bursts — every request must wait its turn in line.

---

## Quick Comparison Table

| Algorithm | Real-world Analogy | Handles Quick Bursts? | Memory Use | Best For... |
| :--- | :--- | :--- | :--- | :--- |
| **Fixed Window** | Wall clock reset | Poor | Very Low | Quick & simple protection |
| **Sliding Window Log** | Rolling 60-second watch | Fair | High | Strict accuracy on low-traffic routes |
| **Token Bucket** | Arcade token bucket | Excellent | Low | General websites & user routes |
| **Leaky Bucket** | Water funnel drip | None (smoothed) | Medium | Background tasks & database workers |

---

## Which Strategy Should You Choose?

- Building a standard website or user API? Use **Token Bucket**. It feels natural to users because it allows quick bursts.
- Need the simplest code with low memory? Use **Fixed Window**.
- Processing background tasks for a database? Use **Leaky Bucket** to keep work steady.
