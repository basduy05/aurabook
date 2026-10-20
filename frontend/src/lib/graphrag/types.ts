export type NodeType =
	| "book"
	| "author"
	| "publisher"
	| "year"
	| "category"
	| "edition"
	| "chapter"
	| "topic";

export type EdgeType =
	| "WRITTEN_BY"
	| "PUBLISHED_BY"
	| "PUBLISHED_IN"
	| "BELONGS_TO"
	| "HAS_EDITION"
	| "CONTAINS_CHAPTER"
	| "COVERS_THEME"
	| "SIMILAR_TO";

export interface GraphNode {
	id: string;
	type: NodeType;
	label: string;
	properties: {
		title?: string;
		originalTitle?: string;
		slug?: string;
		name?: string;
		author?: string;
		publisher?: string;
		publishYear?: string;
		description?: string;
		coverImage?: string;
		rating?: number;
		format?: "ebook" | "physical";
		price?: string;
		originalPrice?: string;
		sku?: string;
		drmStandard?: string;
		chapterTitle?: string;
		chapterIndex?: number;
		topicName?: string;
		categoryName?: string;
		[key: string]: any;
	};
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	type: EdgeType;
	properties?: {
		relation?: string;
		confidence?: number;
		weight?: number;
		[key: string]: any;
	};
}

export interface VectorChunk {
	id: string;
	bookId: string;
	bookSlug: string;
	bookTitle: string;
	chapterTitle: string;
	chapterIndex: number;
	content: string;
	embedding: number[];
	createdAt?: string;
}

export interface FeedbackRecord {
	id: string;
	query: string;
	normalizedQuery: string;
	bookSlug: string;
	type: "like" | "dislike";
	weightDelta: number;
	timestamp: string;
}

export interface GraphRAGStoreData {
	version: string;
	updatedAt: string;
	nodes: GraphNode[];
	edges: GraphEdge[];
	chunks: VectorChunk[];
	feedbackScores?: Record<string, number>;
	feedbacks?: FeedbackRecord[];
}

export interface EPUBMetadata {
	title: string;
	originalTitle?: string;
	author: string;
	publisher: string;
	publishYear: string;
	description: string;
	isbn?: string;
	language: string;
	coverImage?: string;
	category?: string;
	ebookPrice: string;
	physicalPrice: string;
	chapters: Array<{
		title: string;
		href: string;
		contentText: string;
		wordCount?: number;
		charCount?: number;
	}>;
}

export interface GraphRAGQueryResult {
	query: string;
	resolvedBookSlug?: string;
	bookNode?: GraphNode;
	subgraph: {
		nodes: GraphNode[];
		edges: GraphEdge[];
	};
	totalChapters?: number;
	totalWords?: number;
	chapters?: Array<{ index: number; title: string }>;
	relevantChunks: Array<{
		chunk: {
			id: string;
			bookTitle: string;
			chapterTitle: string;
			content: string;
		};
		score: number;
	}>;
	editions: Array<{
		type: "ebook" | "physical";
		name: string;
		price: string;
		sku: string;
	}>;
	contextSummary: string;
}

