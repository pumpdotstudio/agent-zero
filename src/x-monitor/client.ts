// X API client — unified interface for fetching user tweets and profiles
import type { XTweet, XAPITweetsResponse, XAPITweet, XUserProfile } from "./types.js";

const X_API_BASE = "https://api.twitterapi.io";

export class XClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("X_API_KEY is required");
    this.apiKey = apiKey;
  }

  private headers(): Record<string, string> {
    return {
      "X-API-Key": this.apiKey,
      "Content-Type": "application/json",
    };
  }

  // Fetch latest tweets from a user
  async getUserTweets(handle: string, cursor?: string): Promise<{ tweets: XTweet[]; nextCursor?: string; hasMore: boolean }> {
    const params = new URLSearchParams({ userName: handle });
    if (cursor) params.set("cursor", cursor);

    const url = `${X_API_BASE}/twitter/user/last_tweets?${params}`;
    const res = await fetch(url, { method: "GET", headers: this.headers() });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`X API error ${res.status}: ${body}`);
    }

    const raw: XAPITweetsResponse = await res.json();

    if (raw.status !== "200" && raw.status !== "success") {
      throw new Error(`X API returned status: ${raw.status} — ${raw.msg}`);
    }

    const tweets = (raw.tweets ?? []).map((t) => this.normalizeTweet(t, handle));

    return {
      tweets,
      nextCursor: raw.has_next_page ? raw.next_cursor : undefined,
      hasMore: raw.has_next_page ?? false,
    };
  }

  // Search tweets with advanced query syntax
  async searchTweets(query: string, queryType: "Latest" | "Top" = "Latest", cursor?: string): Promise<{ tweets: XTweet[]; nextCursor?: string; hasMore: boolean }> {
    const params = new URLSearchParams({ query, queryType });
    if (cursor) params.set("cursor", cursor);

    const url = `${X_API_BASE}/twitter/tweet/advanced_search?${params}`;
    const res = await fetch(url, { method: "GET", headers: this.headers() });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`X API search error ${res.status}: ${body}`);
    }

    const raw: XAPITweetsResponse = await res.json();
    const tweets = (raw.tweets ?? []).map((t) => this.normalizeTweet(t, "search"));

    return {
      tweets,
      nextCursor: raw.has_next_page ? raw.next_cursor : undefined,
      hasMore: raw.has_next_page ?? false,
    };
  }

  // Get user profile info
  async getUserInfo(handle: string): Promise<XUserProfile> {
    const url = `${X_API_BASE}/twitter/user/info?userName=${handle}`;
    const res = await fetch(url, { method: "GET", headers: this.headers() });

    if (!res.ok) throw new Error(`X API user info error ${res.status}`);

    const raw = await res.json();
    const u = raw.data;

    return {
      id: u.id,
      handle: u.userName,
      name: u.name,
      bio: u.description ?? "",
      followers: u.followers ?? 0,
      following: u.following ?? 0,
      tweetCount: u.statusesCount ?? 0,
      verified: u.isBlueVerified ?? false,
      profileImageUrl: u.profilePicture ?? "",
    };
  }

  // Get mentions of a user
  async getUserMentions(handle: string, sinceTime?: number): Promise<{ tweets: XTweet[]; nextCursor?: string; hasMore: boolean }> {
    const params = new URLSearchParams({ userName: handle });
    if (sinceTime) params.set("sinceTime", sinceTime.toString());

    const url = `${X_API_BASE}/twitter/user/mentions?${params}`;
    const res = await fetch(url, { method: "GET", headers: this.headers() });

    if (!res.ok) throw new Error(`X API mentions error ${res.status}`);

    const raw = await res.json();
    const tweets = (raw.tweets ?? []).map((t: XAPITweet) => this.normalizeTweet(t, handle));

    return {
      tweets,
      nextCursor: raw.has_next_page ? raw.next_cursor : undefined,
      hasMore: raw.has_next_page ?? false,
    };
  }

  // Normalize raw API tweet into our clean type
  private normalizeTweet(raw: XAPITweet, fallbackHandle: string): XTweet {
    return {
      id: raw.id,
      text: raw.text ?? "",
      createdAt: raw.createdAt ?? new Date().toISOString(),
      authorHandle: raw.author?.userName ?? fallbackHandle,
      authorName: raw.author?.name ?? fallbackHandle,
      url: raw.url ?? `https://x.com/${raw.author?.userName ?? fallbackHandle}/status/${raw.id}`,
      metrics: {
        likes: raw.likeCount ?? 0,
        retweets: raw.retweetCount ?? 0,
        replies: raw.replyCount ?? 0,
        views: raw.viewCount ?? 0,
        quotes: raw.quoteCount ?? 0,
        bookmarks: raw.bookmarkCount ?? 0,
      },
      isRetweet: raw.type === "retweet" || !!raw.retweeted_tweet,
      isReply: raw.isReply ?? !!raw.inReplyToId,
      quotedTweetId: raw.quoted_tweet?.id,
      inReplyToId: raw.inReplyToId ?? undefined,
      urls: (raw.entities?.urls ?? []).map((u) => u.expanded_url).filter(Boolean),
      hashtags: (raw.entities?.hashtags ?? []).map((h) => h.text).filter(Boolean),
      mentions: (raw.entities?.user_mentions ?? []).map((m) => m.screen_name).filter(Boolean),
    };
  }
}
