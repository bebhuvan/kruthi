export class AppError extends Error {
	constructor(message: string, public code: string) {
		super(message);
		this.name = 'AppError';
	}
}

export class RetrievalError extends AppError {
	constructor(message: string, public bookId: string) {
		super(message, 'RETRIEVAL_ERROR');
		this.name = 'RetrievalError';
	}
}

export class LLMError extends AppError {
	constructor(message: string, public statusCode?: number) {
		super(message, 'LLM_ERROR');
		this.name = 'LLMError';
	}
}
