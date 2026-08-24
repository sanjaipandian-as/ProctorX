import psycopg2
from psycopg2.extras import execute_values
import uuid
import os
from app.config import settings

class QdrantService:
    def __init__(self):
        self.conn_str = settings.VECTOR_DATABASE_URL
        self._ensure_table()

    def _get_connection(self):
        return psycopg2.connect(self.conn_str)

    def _ensure_table(self):
        """Ensures the pgvector extension and the document_chunks table exist."""
        conn = None
        try:
            conn = self._get_connection()
            conn.autocommit = True
            with conn.cursor() as cur:
                # Enable pgvector extension
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                
                # Create table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS document_chunks (
                        id UUID PRIMARY KEY,
                        teacher_id VARCHAR(255) NOT NULL,
                        document_id VARCHAR(255) NOT NULL,
                        chunk_id VARCHAR(255) NOT NULL,
                        filename VARCHAR(255) NOT NULL,
                        page INTEGER NOT NULL,
                        text TEXT NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        embedding VECTOR(2048) NOT NULL
                    );
                """)
                
                # Create indices for faster queries
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_chunks_teacher_doc 
                    ON document_chunks (teacher_id, document_id);
                """)
            print("Postgres PGVector storage table ensured successfully.")
        except Exception as e:
            print(f"Error ensuring PGVector table (make sure Neon db supports vector extension): {e}")
        finally:
            if conn:
                conn.close()

    def upsert_chunks(self, document_id: str, chunks: list[dict], embeddings: list[list[float]], teacher_id: str, filename: str):
        """Upserts document chunks with teacher isolation and metadata."""
        conn = None
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                # Prepare batch values
                data = []
                for idx, (chunk_obj, embedding) in enumerate(zip(chunks, embeddings)):
                    chunk_text = chunk_obj["text"]
                    page_num = chunk_obj["page"]
                    chunk_id_str = f"{document_id}_{idx}"
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id_str))
                    
                    data.append((
                        point_id,
                        teacher_id,
                        document_id,
                        chunk_id_str,
                        filename,
                        page_num,
                        chunk_text,
                        idx,
                        str(embedding)  # Convert list of floats to string vector format
                    ))
                
                # Execute upsert in batch
                execute_values(
                    cur,
                    """
                    INSERT INTO document_chunks (id, teacher_id, document_id, chunk_id, filename, page, text, chunk_index, embedding)
                    VALUES %s
                    ON CONFLICT (id) DO UPDATE SET
                        teacher_id = EXCLUDED.teacher_id,
                        document_id = EXCLUDED.document_id,
                        chunk_id = EXCLUDED.chunk_id,
                        filename = EXCLUDED.filename,
                        page = EXCLUDED.page,
                        text = EXCLUDED.text,
                        chunk_index = EXCLUDED.chunk_index,
                        embedding = EXCLUDED.embedding;
                    """,
                    data
                )
                conn.commit()
            print(f"Successfully upserted {len(chunks)} chunks to Postgres vector store.")
        except Exception as e:
            print(f"Error upserting chunks: {e}")
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()

    def search_similar_chunks(self, document_id: str, query_embedding: list[float], teacher_id: str, limit: int = 5) -> list[dict]:
        """Searches for chunks similar to the query, strictly isolated by teacherId and documentId."""
        conn = None
        results = []
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                # <=> is cosine distance operator in pgvector
                # Cosine similarity is 1 - (embedding <=> query_embedding)
                cur.execute(
                    """
                    SELECT chunk_id, document_id, page, text, (1 - (embedding <=> %s::vector)) as score
                    FROM document_chunks
                    WHERE teacher_id = %s AND document_id = %s
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s;
                    """,
                    (str(query_embedding), teacher_id, document_id, str(query_embedding), limit)
                )
                rows = cur.fetchall()
                for row in rows:
                    results.append({
                        "chunkId": row[0],
                        "documentId": row[1],
                        "page": row[2],
                        "text": row[3],
                        "score": float(row[4]) if row[4] is not None else 0.0
                    })
        except Exception as e:
            print(f"Error searching similar chunks: {e}")
        finally:
            if conn:
                conn.close()
        return results

    def get_representative_chunks(self, document_id: str, teacher_id: str, limit: int = 8) -> list[dict]:
        """Retrieves a representative spread of chunks from a document sequentially."""
        conn = None
        chunks = []
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT chunk_id, document_id, page, text, chunk_index
                    FROM document_chunks
                    WHERE teacher_id = %s AND document_id = %s
                    ORDER BY chunk_index ASC
                    LIMIT 100;
                    """,
                    (teacher_id, document_id)
                )
                rows = cur.fetchall()
                for row in rows:
                    chunks.append({
                        "chunkId": row[0],
                        "documentId": row[1],
                        "page": row[2],
                        "text": row[3],
                        "chunk_index": row[4],
                        "score": 1.0
                    })
        except Exception as e:
            print(f"Error fetching representative chunks: {e}")
        finally:
            if conn:
                conn.close()

        if not chunks:
            return []
            
        n = len(chunks)
        if n <= limit:
            return chunks
            
        sampled = []
        for i in range(limit):
            idx = int(i * (n - 1) / (limit - 1))
            sampled.append(chunks[idx])
            
        return sampled

    def delete_document(self, document_id: str, teacher_id: str):
        """Deletes a document from the vector store."""
        conn = None
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM document_chunks
                    WHERE document_id = %s AND teacher_id = %s;
                    """,
                    (document_id, teacher_id)
                )
                conn.commit()
            print(f"Deleted document {document_id} chunks from Postgres vector store.")
        except Exception as e:
            print(f"Error deleting document {document_id} from vector store: {e}")
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()

qdrant_service = QdrantService()
