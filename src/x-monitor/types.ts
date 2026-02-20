// X API response types — normalized internal types + raw API shapes

export interface XTweet {
  id: string;
  text: string;
  createdAt: string;
  authorHandle: string;
  authorName: string;
  url: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    quotes: number;
    bookmarks: number;
  };
  isRetweet: boolean;
  isReply: boolean;
  quotedTweetId?: string;
  inReplyToId?: string;
  urls: string[];
  hashtags: string[];
  mentions: string[];
}

export interface XUserProfile {
  id: string;
  handle: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  tweetCount: number;
  verified: boolean;
  profileImageUrl: string;
}

export interface MonitorResult {
  account: string;
  tweets: XTweet[];
  fetchedAt: string;
  newSinceLastCheck: number;
}

export interface IntelAlert {
  type: "hackathon_mention" | "winner_announcement" | "advisor_signal" | "competitor_activity" | "pump_studio_mention";
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  tweet: XTweet;
  summary: string;
  detectedAt: string;
}

// Raw X API response — get_user_last_tweets
export interface XAPITweetsResponse {
  status: string;
  msg: string;
  tweets: XAPITweet[];
  has_next_page: boolean;
  next_cursor: string;
}

// Raw X API tweet object
export interface XAPITweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  bookmarkCount: number;
  createdAt: string;
  lang: string;
  isReply: boolean;
  inReplyToId: string | null;
  conversationId: string;
  author: {
    type: string;
    userName: string;
    url: string;
    id: string;
    name: string;
    isBlueVerified: boolean;
    profilePicture: string;
    followers: number;
    following: number;
  };
  entities: {
    hashtags: Array<{ text: string }>;
    urls: Array<{ expanded_url: string; display_url: string }>;
    user_mentions: Array<{ screen_name: string; name: string }>;
  };
  quoted_tweet?: XAPITweet | null;
  retweeted_tweet?: XAPITweet | null;
}
