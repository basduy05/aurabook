# Generated manually for pgvector 768-dim conversion
from django.db import migrations, models
import aurabook_apps.ai_search.models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_search', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='bookchunk',
                    name='embedding',
                    field=aurabook_apps.ai_search.models.VectorField(
                        blank=True, dimensions=768, null=True
                    ),
                ),
                migrations.AddIndex(
                    model_name='bookchunk',
                    index=models.Index(fields=['product_slug'], name='ai_search_b_product_81807e_idx'),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    CREATE EXTENSION IF NOT EXISTS vector;
                    CREATE EXTENSION IF NOT EXISTS unaccent;
                    CREATE EXTENSION IF NOT EXISTS pg_trgm;
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='ai_search_bookchunk' AND column_name='embedding' AND data_type='bytea'
                        ) THEN
                            ALTER TABLE ai_search_bookchunk ALTER COLUMN embedding TYPE vector(768) USING NULL;
                        END IF;
                    END $$;
                    CREATE INDEX IF NOT EXISTS ai_search_bookchunk_embedding_hnsw_idx 
                        ON ai_search_bookchunk USING hnsw (embedding vector_cosine_ops);
                    CREATE INDEX IF NOT EXISTS ai_search_b_product_81807e_idx
                        ON ai_search_bookchunk (product_slug);
                    """,
                    reverse_sql="""
                    DROP INDEX IF EXISTS ai_search_bookchunk_embedding_hnsw_idx;
                    DROP INDEX IF EXISTS ai_search_b_product_81807e_idx;
                    ALTER TABLE ai_search_bookchunk 
                        ALTER COLUMN embedding TYPE bytea USING NULL;
                    """,
                ),
            ],
        ),
    ]
