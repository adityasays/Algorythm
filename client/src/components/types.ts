import React from 'react';

export interface Tab {
  title: string;
  value: string;
  content: React.ReactNode;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
}

export interface Author {
  name: string;
  username: string;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  author: Author;
  createdAt: string;
  publishedAt: string;
  tags: string[];
  likes: number;
  readTime: string;
  isLiked: boolean;
}

export interface BlogFormData {
  title: string;
  content: string;
  category: string;
  readTime?: number;
  tags?: string[];
}

export type SortBy = 'newest' | 'popular';