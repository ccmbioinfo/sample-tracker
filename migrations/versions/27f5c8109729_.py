"""empty message

Revision ID: 27f5c8109729
Revises: 
Create Date: 2019-02-05 15:29:10.641703

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '27f5c8109729'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('cohort',
    sa.Column('CohortID', sa.Integer(), nullable=False),
    sa.Column('CohortName', sa.String(length=100), nullable=False),
    sa.Column('CohortDescription', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('CohortID'),
    sa.UniqueConstraint('CohortName')
    )
    op.create_table('family',
    sa.Column('FamilyID', sa.String(length=30), nullable=False),
    sa.PrimaryKeyConstraint('FamilyID')
    )
    op.create_table('uploaders',
    sa.Column('UploadID', sa.Integer(), nullable=False),
    sa.Column('UploadCenter', sa.String(length=100), nullable=False),
    sa.Column('UploadUser', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('UploadID'),
    sa.UniqueConstraint('UploadCenter', 'UploadUser', name='unique_center_user')
    )
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=30), nullable=False),
    sa.Column('password', sa.String(length=200), nullable=False),
    sa.Column('email', sa.String(length=150), nullable=False),
    sa.Column('accessLevel', sa.Enum('Admin', 'Regular', name='accesslevel'), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('username')
    )
    op.create_table('cohort2Family',
    sa.Column('CohortID', sa.Integer(), nullable=False),
    sa.Column('FamilyID', sa.String(length=30), nullable=False),
    sa.ForeignKeyConstraint(['CohortID'], ['cohort.CohortID'], onupdate='cascade', ondelete='cascade'),
    sa.ForeignKeyConstraint(['FamilyID'], ['family.FamilyID'], onupdate='cascade', ondelete='cascade'),
    sa.PrimaryKeyConstraint('CohortID', 'FamilyID')
    )
    op.create_table('sample',
    sa.Column('SampleID', sa.String(length=50), nullable=False),
    sa.Column('SampleName', sa.String(length=50), nullable=False),
    sa.Column('Gender', sa.Enum('Male', 'Female', name='sexenum'), nullable=True),
    sa.Column('FamilyID', sa.String(length=30), nullable=False),
    sa.Column('SampleType', sa.String(length=30), nullable=True),
    sa.Column('PhenomeCentralSampleID', sa.String(length=45), nullable=True),
    sa.ForeignKeyConstraint(['FamilyID'], ['family.FamilyID'], onupdate='cascade', ondelete='cascade'),
    sa.PrimaryKeyConstraint('SampleID')
    )
    op.create_table('dataset',
    sa.Column('DatasetID', sa.Integer(), nullable=False),
    sa.Column('SampleID', sa.String(length=50), nullable=False),
    sa.Column('UploadDate', sa.Date(), nullable=False),
    sa.Column('UploadID', sa.Integer(), nullable=False),
    sa.Column('UploadStatus', sa.String(length=45), nullable=False),
    sa.Column('HPFPath', sa.String(length=500), nullable=True),
    sa.Column('DatasetType', sa.String(length=45), nullable=False),
    sa.Column('SolvedStatus', sa.String(length=30), nullable=False),
    sa.Column('InputFile', sa.Text(), nullable=True),
    sa.Column('RunID', sa.String(length=45), nullable=True),
    sa.Column('Notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['SampleID'], ['sample.SampleID'], onupdate='cascade', ondelete='restrict'),
    sa.ForeignKeyConstraint(['UploadID'], ['uploaders.UploadID'], onupdate='cascade', ondelete='restrict'),
    sa.PrimaryKeyConstraint('DatasetID')
    )
    op.create_table('analysis',
    sa.Column('AnalysisID', sa.String(length=100), nullable=False),
    sa.Column('DatasetID', sa.Integer(), nullable=False),
    sa.Column('PipelineVersion', sa.String(length=30), nullable=True),
    sa.Column('ResultsDirectory', sa.Text(), nullable=True),
    sa.Column('ResultsBAM', sa.Text(), nullable=True),
    sa.Column('AssignedTo', sa.String(length=100), nullable=True),
    sa.ForeignKeyConstraint(['DatasetID'], ['dataset.DatasetID'], onupdate='cascade', ondelete='cascade'),
    sa.PrimaryKeyConstraint('AnalysisID')
    )
    op.create_table('dataset2Cohort',
    sa.Column('DatasetID', sa.Integer(), nullable=False),
    sa.Column('CohortID', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['CohortID'], ['cohort.CohortID'], onupdate='cascade', ondelete='restrict'),
    sa.ForeignKeyConstraint(['DatasetID'], ['dataset.DatasetID'], onupdate='cascade', ondelete='cascade'),
    sa.PrimaryKeyConstraint('DatasetID', 'CohortID')
    )
    op.create_table('analysisStatus',
    sa.Column('AnalysisID', sa.String(length=100), nullable=False),
    sa.Column('AnalysisStep', sa.String(length=45), nullable=False),
    sa.Column('UpdateDate', sa.DateTime(), nullable=False),
    sa.Column('UpdateUser', sa.Integer(), nullable=True),
    sa.Column('Notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['AnalysisID'], ['analysis.AnalysisID'], onupdate='cascade', ondelete='cascade'),
    sa.ForeignKeyConstraint(['UpdateUser'], ['user.id'], onupdate='cascade', ondelete='restrict'),
    sa.PrimaryKeyConstraint('AnalysisID', 'AnalysisStep')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('analysisStatus')
    op.drop_table('dataset2Cohort')
    op.drop_table('analysis')
    op.drop_table('dataset')
    op.drop_table('sample')
    op.drop_table('cohort2Family')
    op.drop_table('user')
    op.drop_table('uploaders')
    op.drop_table('family')
    op.drop_table('cohort')
    # ### end Alembic commands ###
