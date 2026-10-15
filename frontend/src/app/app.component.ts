import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface Source {
  page: number;
  text: string;
  score: number;
}
interface ChatResponse {
  answer: string;
  sources: Source[];
  mode: string;
}
interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
  sources?: Source[];
  mode?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly apiBase = 'http://localhost:8000/api';

  selectedFile: File | null = null;
  filename = '';
  documentPages = 0;
  question = '';
  uploading = false;
  asking = false;
  clearing = false;
  error = '';
  notice = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: 'Welcome to CloudSage. Upload a text-based PDF, then ask a question. I’ll search the document and show the passages used for the answer.'
    }
  ];

  constructor(private readonly http: HttpClient) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.error = '';
    this.notice = '';
    if (this.selectedFile && !this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      this.error = 'Please choose a PDF file.';
      this.selectedFile = null;
    }
  }

  async uploadDocument(): Promise<void> {
    if (!this.selectedFile || this.uploading) return;
    this.uploading = true;
    this.error = '';
    this.notice = '';
    const body = new FormData();
    body.append('file', this.selectedFile);
    try {
      const result = await firstValueFrom(
        this.http.post<{ message: string; filename: string; pages: number; chunks: number }>(
          `${this.apiBase}/documents`, body
        )
      );
      this.filename = result.filename;
      this.documentPages = result.pages;
      this.notice = `${result.message} ${result.pages} page(s) indexed.`;
      this.messages = [{
        role: 'assistant',
        text: `I’ve indexed “${result.filename}”. Ask me a question about its contents and I’ll include the relevant source passages.`
      }];
      this.selectedFile = null;
    } catch (err) {
      this.error = this.errorMessage(err, 'Could not upload the PDF.');
    } finally {
      this.uploading = false;
    }
  }

  onQuestionKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.askQuestion();
    }
  }

  async askQuestion(): Promise<void> {
    const question = this.question.trim();
    if (!question || this.asking) return;
    if (!this.filename) {
      this.error = 'Upload a PDF before asking a question.';
      return;
    }
    this.error = '';
    this.notice = '';
    this.messages = [...this.messages, { role: 'user', text: question }];
    this.question = '';
    this.asking = true;
    try {
      const response = await firstValueFrom(
        this.http.post<ChatResponse>(`${this.apiBase}/chat`, { question })
      );
      this.messages = [...this.messages, {
        role: 'assistant',
        text: response.answer,
        sources: response.sources,
        mode: response.mode
      }];
    } catch (err) {
      this.error = this.errorMessage(err, 'Could not get an answer.');
    } finally {
      this.asking = false;
    }
  }

  async clearDocument(): Promise<void> {
    if (this.clearing) return;
    this.clearing = true;
    this.error = '';
    try {
      await firstValueFrom(this.http.delete(`${this.apiBase}/documents`));
      this.filename = '';
      this.documentPages = 0;
      this.messages = [{
        role: 'assistant',
        text: 'Document cleared. Upload another PDF whenever you’re ready.'
      }];
      this.notice = 'Document removed from the server’s in-memory index.';
    } catch (err) {
      this.error = this.errorMessage(err, 'Could not clear the document.');
    } finally {
      this.clearing = false;
    }
  }

  private errorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const detail = err.error?.detail;
      if (typeof detail === 'string') return detail;
      if (err.status === 0) return 'Cannot connect to the backend. Check that FastAPI is running on http://localhost:8000.';
    }
    return fallback;
  }
}
