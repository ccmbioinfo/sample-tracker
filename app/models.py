from app import db, login
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import enum

class SexEnum(enum.Enum):
	Male = 'Male'
	Female = 'Female'

class AccessLevel(enum.Enum):
    Admin = 'Admin'
    Regular = 'Regular'

class User(UserMixin, db.Model) :

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), unique=True, nullable=False)
    password = db.Column(db.String(200), unique=False, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    accessLevel = db.Column(db.Enum(AccessLevel), default='Regular')
    updateUsers = db.relationship('AnalysisStatus',backref='user',lazy='dynamic')

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Family(db.Model):
	
	FamilyID = db.Column(db.String(30), primary_key=True)
	samples = db.relationship('Sample',backref='family',lazy ='dynamic')
	cohorts = db.relationship('Cohort2Family',backref='family',lazy='dynamic')

class Sample(db.Model):
	
	SampleID = db.Column(db.String(50), primary_key=True)
	SampleName = db.Column(db.String(50), nullable=False)
	Gender = db.Column(db.Enum(SexEnum))
	FamilyID = db.Column(db.String(30), db.ForeignKey('family.FamilyID',onupdate="cascade",ondelete="cascade"), nullable=False)
	SampleType = db.Column(db.String(30))
	PhenomeCentralSampleID = db.Column(db.String(45))
	samples = db.relationship("Dataset", backref='sample', lazy='dynamic')

class Cohort(db.Model):

    CohortID = db.Column(db.Integer, primary_key=True)
    CohortName = db.Column(db.String(100), nullable=False, unique=True)
    CohortDescription = db.Column(db.Text)
    cohorts = db.relationship('Cohort2Family',backref='cohort',lazy='dynamic')	
    cohorts2Data = db.relationship('Dataset2Cohort', backref='cohort',lazy='dynamic')

class Cohort2Family(db.Model):

	__tablename__="cohort2Family"
	CohortID = db.Column(db.Integer, db.ForeignKey('cohort.CohortID',onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)
	FamilyID = db.Column(db.String(30), db.ForeignKey('family.FamilyID',onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)

class Dataset(db.Model):

	DatasetID = db.Column(db.Integer, primary_key = True)
	SampleID = db.Column(db.String(50), db.ForeignKey('sample.SampleID', onupdate="cascade",ondelete="restrict"), nullable=False)
	UploadDate = db.Column(db.Date, nullable=False)
	UploadID = db.Column(db.Integer,db.ForeignKey('uploaders.UploadID', onupdate="cascade",ondelete="restrict"), nullable=False)
	UploadStatus = db.Column(db.String(45), nullable=False)
	HPFPath = db.Column(db.String(500))
	DatasetType = db.Column(db.String(45), nullable=False)
	SolvedStatus = db.Column(db.String(30), nullable=False)
	InputFile = db.Column(db.Text)
	RunID = db.Column(db.String(45))
	Notes = db.Column(db.Text)
	analyses = db.relationship('Analysis',backref='dataset',lazy='dynamic')
	data2Cohorts = db.relationship('Dataset2Cohort',backref='dataset',lazy='dynamic')

class Dataset2Cohort(db.Model):
	
	__tablename__='dataset2Cohort'
	DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)
	CohortID = db.Column(db.Integer, db.ForeignKey('cohort.CohortID', onupdate="cascade", ondelete="restrict"),  nullable=False, primary_key = True)

class Uploaders(db.Model):

	__table_args__ = (
		db.UniqueConstraint('UploadCenter','UploadUser',name='unique_center_user'),
	)
	UploadID = db.Column(db.Integer, primary_key = True)
	UploadCenter = db.Column(db.String(100), nullable=False)
	UploadUser = db.Column(db.String(100), nullable=False)
	uploaders = db.relationship('Dataset',backref='uploaders',lazy='dynamic')

class Analysis(db.Model):

    AnalysisID = db.Column(db.String(100), primary_key = True)
    DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="cascade"), nullable=False)
    PipelineVersion = db.Column(db.String(30))
    ResultsDirectory = db.Column(db.Text)
    ResultsBAM = db.Column(db.Text)
    AssignedTo = db.Column(db.String(100), nullable=True)
    analysisStatuses = db.relationship('AnalysisStatus', backref='analysis', lazy='dynamic')

class AnalysisStatus(db.Model):
    
    __tablename__ = "analysisStatus"
    AnalysisID = db.Column(db.String(100), db.ForeignKey('analysis.AnalysisID', onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)
    AnalysisStep = db.Column(db.String(45), nullable = False, primary_key = True)
    UpdateDate = db.Column(db.DateTime, nullable = False)
    UpdateUser = db.Column(db.Integer, db.ForeignKey('user.id', onupdate="cascade",ondelete="restrict"))
    Notes = db.Column(db.Text)


@login.user_loader
def load_user(id):
        return User.query.get(int(id))


