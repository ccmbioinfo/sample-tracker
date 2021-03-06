"""empty message

Revision ID: 6c71240c9976
Revises: 95622996b1a5
Create Date: 2019-07-15 19:56:21.093991

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '6c71240c9976'
down_revision = '95622996b1a5'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('dataset2Uploaders',
    sa.Column('uploadID', sa.Integer(), nullable=False),
    sa.Column('DatasetID', sa.Integer(), nullable=True),
    sa.Column('UploadDate', sa.Date(), nullable=True),
    sa.Column('UploaderID', sa.Integer(), nullable=True),
    sa.Column('UploadStatus', sa.String(length=45), nullable=False),
    sa.ForeignKeyConstraint(['DatasetID'], ['dataset.DatasetID'], onupdate='cascade', ondelete='restrict'),
    sa.ForeignKeyConstraint(['UploaderID'], ['uploaders.UploadID'], onupdate='cascade', ondelete='restrict'),
    sa.PrimaryKeyConstraint('uploadID', 'DatasetID')
    )
    op.create_table('rnaSeqDataset',
    sa.Column('RnaSeqDatasetID', sa.Integer(), nullable=False),
    sa.Column('DatasetID', sa.Integer(), nullable=False),
    sa.Column('WLNumber', sa.String(length=30), nullable=True),
    sa.Column('TissueType', sa.String(length=30), nullable=True),
    sa.Column('TissueProcessing', sa.String(length=30), nullable=True),
    sa.Column('Condition', sa.String(length=30), nullable=True),
    sa.Column('ExtractionMethod', sa.String(length=50), nullable=True),
    sa.Column('RIN', sa.Float(), nullable=True),
    sa.Column('DV200', sa.Integer(), nullable=True),
    sa.Column('DV200Classification', sa.String(length=30), nullable=True),
    sa.Column('QubitRNAConcentration', sa.Float(), nullable=True),
    sa.Column('LibraryPrepMethod', sa.String(length=30), nullable=True),
    sa.Column('Sequencer', sa.String(length=30), nullable=True),
    sa.ForeignKeyConstraint(['DatasetID'], ['dataset.DatasetID'], onupdate='cascade', ondelete='cascade'),
    sa.PrimaryKeyConstraint('RnaSeqDatasetID', 'DatasetID')
    )
    op.add_column('dataset', sa.Column('EnteredBy', sa.Integer(), nullable=True))
    op.add_column('dataset', sa.Column('EnteredDate', sa.Date(), nullable=True))
    op.add_column('dataset', sa.Column('NotesLastUpdatedBy', sa.Integer(), nullable=True))
    op.add_column('dataset', sa.Column('NotesLastUpdatedDate', sa.Date(), nullable=True))
    op.add_column('dataset', sa.Column('SendTo', sa.String(length=30), nullable=True))
    op.alter_column('dataset', 'UploadDate',
               existing_type=sa.DATE(),
               nullable=True)
    op.alter_column('dataset', 'UploadID',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=True)
    op.create_unique_constraint('unique_sample_datasettype_per_entered_date', 'dataset', ['SampleID', 'EnteredDate', 'DatasetType'])
    op.drop_index('unique_sample_datasettype_perdate', table_name='dataset')
    op.drop_constraint('dataset_ibfk_2', 'dataset', type_='foreignkey')
    op.create_foreign_key(None, 'dataset', 'user', ['NotesLastUpdatedBy'], ['id'], onupdate='cascade', ondelete='restrict')
    op.create_foreign_key(None, 'dataset', 'uploaders', ['EnteredBy'], ['UploadID'], onupdate='cascade', ondelete='restrict')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'dataset', type_='foreignkey')
    op.drop_constraint(None, 'dataset', type_='foreignkey')
    op.create_foreign_key('dataset_ibfk_2', 'dataset', 'uploaders', ['UploadID'], ['UploadID'], onupdate='CASCADE')
    op.create_index('unique_sample_datasettype_perdate', 'dataset', ['SampleID', 'UploadDate', 'DatasetType'], unique=True)
    op.drop_constraint('unique_sample_datasettype_per_entered_date', 'dataset', type_='unique')
    op.alter_column('dataset', 'UploadID',
               existing_type=mysql.INTEGER(display_width=11),
               nullable=False)
    op.alter_column('dataset', 'UploadDate',
               existing_type=sa.DATE(),
               nullable=False)
    op.drop_column('dataset', 'SendTo')
    op.drop_column('dataset', 'NotesLastUpdatedDate')
    op.drop_column('dataset', 'NotesLastUpdatedBy')
    op.drop_column('dataset', 'EnteredDate')
    op.drop_column('dataset', 'EnteredBy')
    op.drop_table('rnaSeqDataset')
    op.drop_table('dataset2Uploaders')
    # ### end Alembic commands ###
