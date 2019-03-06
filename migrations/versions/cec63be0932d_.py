"""empty message

Revision ID: cec63be0932d
Revises: 930d79a56470
Create Date: 2019-02-28 20:34:44.549079

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cec63be0932d'
down_revision = '930d79a56470'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('analysis', sa.Column('RequestedDate', sa.Date(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('analysis', 'RequestedDate')
    # ### end Alembic commands ###