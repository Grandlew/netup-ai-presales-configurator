"""create initial tables"""

from alembic import op
import sqlalchemy as sa


revision = "20260625_000001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "leads",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("contact_name", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=64), nullable=True),
        sa.Column("company", sa.String(length=255), nullable=True),
        sa.Column("country", sa.String(length=120), nullable=True),
        sa.Column("project_type", sa.String(length=64), nullable=True),
        sa.Column("requirements_json", sa.JSON(), nullable=False),
        sa.Column("recommendation_json", sa.JSON(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("consent_given", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "product_rule_versions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("version", sa.String(length=64), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
    )
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("lead_id", sa.String(length=36), sa.ForeignKey("leads.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("messages_json", sa.JSON(), nullable=False),
        sa.Column("extracted_requirements_json", sa.JSON(), nullable=False),
    )
    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("lead_id", sa.String(length=36), sa.ForeignKey("leads.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("generated_content", sa.Text(), nullable=False),
        sa.Column("version", sa.String(length=32), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("conversations")
    op.drop_table("product_rule_versions")
    op.drop_table("leads")
