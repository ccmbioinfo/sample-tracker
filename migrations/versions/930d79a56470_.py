"""empty message

Revision ID: 930d79a56470
Revises: 59e242eb7d03
Create Date: 2019-02-20 20:33:35.354823

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '930d79a56470'
down_revision = '59e242eb7d03'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('dataset', 'ActiveCohort',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=False)
    op.create_unique_constraint('unique_sample_datasettype_perdate', 'dataset', ['SampleID', 'UploadDate', 'DatasetType'])
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('unique_sample_datasettype_perdate', 'dataset', type_='unique')
    op.alter_column('dataset', 'ActiveCohort',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=True)
    # ### end Alembic commands ###