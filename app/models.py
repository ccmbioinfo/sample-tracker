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
    projectUsers = db.relationship('Projects2Users',backref='user',lazy='dynamic')

    def check_password(self, password):
        return check_password_hash(self.password, password)

class Family(db.Model):
	
	FamilyID = db.Column(db.String(30), primary_key=True)
	samples = db.relationship('Sample',backref='family',lazy ='dynamic')

class Sample(db.Model):
	
    SampleID = db.Column(db.String(50), primary_key=True)
    SampleName = db.Column(db.String(50), nullable=False)
    Gender = db.Column(db.Enum(SexEnum))
    FamilyID = db.Column(db.String(30), db.ForeignKey('family.FamilyID',onupdate="cascade",ondelete="cascade"), nullable=False)
    SampleType = db.Column(db.String(30))
    TissueType = db.Column(db.String(30))
    PhenomeCentralSampleID = db.Column(db.String(45))
    samples = db.relationship("Dataset", backref='sample', lazy='dynamic')

class Project(db.Model):

    ProjectID = db.Column(db.Integer, primary_key=True)
    ProjectName = db.Column(db.String(100), nullable=False, unique=True)
    ProjectDescription = db.Column(db.Text)
    projects2Cohort = db.relationship('Cohort', backref='project',lazy='dynamic')
    projects2User = db.relationship('Projects2Users', backref='project',lazy='dynamic')

class Projects2Users(db.Model):
    
    __tablename__ = "projects2Users"
    ProjectID = db.Column(db.Integer,db.ForeignKey('project.ProjectID',onupdate="cascade",ondelete="restrict"), primary_key = True)
    userID  = db.Column(db.Integer, db.ForeignKey('user.id',onupdate="cascade",ondelete="restrict"), primary_key = True)

class Cohort(db.Model):

    CohortID = db.Column(db.Integer, primary_key=True)
    CohortName = db.Column(db.String(100), nullable=False, unique=True)
    CohortDescription = db.Column(db.Text)
    ProjectID = db.Column(db.Integer,db.ForeignKey('project.ProjectID',onupdate="cascade",ondelete="restrict"))
    cohorts2Data = db.relationship('Dataset2Cohort', backref='cohort',lazy='dynamic')
    cohorts2Dataset = db.relationship('Dataset', backref='cohort',lazy='dynamic')

class Dataset(db.Model):

    __table_args__ = (
        db.UniqueConstraint('SampleID','EnteredDate','DatasetType', name='unique_sample_datasettype_per_entered_date'),
    )
    DatasetID = db.Column(db.Integer, primary_key = True)
    SampleID = db.Column(db.String(50), db.ForeignKey('sample.SampleID', onupdate="cascade",ondelete="restrict"), nullable=False)
    EnteredDate = db.Column(db.Date, nullable=True)
    EnteredBy = db.Column(db.Integer,db.ForeignKey('uploaders.UploadID', onupdate="cascade",ondelete="restrict"), nullable=True)
    UploadDate = db.Column(db.Date, nullable=True)
    UploadID = db.Column(db.Integer, nullable=True)
    UploadStatus = db.Column(db.String(45), nullable=False, default="pending")
    HPFPath = db.Column(db.String(500))
    DatasetType = db.Column(db.String(45), nullable=False)
    SolvedStatus = db.Column(db.String(30), nullable=False)
    InputFile = db.Column(db.Text)
    RunID = db.Column(db.String(45))
    SendTo = db.Column(db.String(30))
    Notes = db.Column(db.Text)
    NotesLastUpdatedDate = db.Column(db.Date)
    NotesLastUpdatedBy = db.Column(db.Integer, db.ForeignKey('user.id', onupdate="cascade",ondelete="restrict"), nullable=True)
    ActiveCohort = db.Column(db.Integer,db.ForeignKey('cohort.CohortID', onupdate="cascade",ondelete="restrict"), nullable=False)
    analyses = db.relationship('Analysis',backref='dataset',lazy='dynamic')
    data2Cohorts = db.relationship('Dataset2Cohort',backref='dataset',lazy='dynamic')
    dataset2Rnaseq = db.relationship('RNASeqDataset',backref='dataset',lazy='dynamic')
    uploads = db.relationship('Dataset2Uploaders',backref='dataset',lazy='dynamic')

class Dataset2Uploaders(db.Model):

    __tablename__ = "dataset2Uploaders"
    uploadID = db.Column(db.Integer, primary_key = True)
    DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="restrict"), primary_key = True, nullable=True)
    UploadDate = db.Column(db.Date, nullable=True)
    UploaderID = db.Column(db.Integer,db.ForeignKey('uploaders.UploadID', onupdate="cascade",ondelete="restrict"), nullable=True) 
    UploadStatus = db.Column(db.String(45), nullable=False, default="pending")

class Dataset2Cohort(db.Model):
	
	__tablename__='dataset2Cohort'
	DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)
	CohortID = db.Column(db.Integer, db.ForeignKey('cohort.CohortID', onupdate="cascade", ondelete="restrict"),  nullable=False, primary_key = True)

class RNASeqDataset(db.Model):
    
    __tablename__='rnaSeqDataset'
    RnaSeqDatasetID = db.Column(db.Integer, primary_key = True)
    DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True) 
    WLNumber = db.Column(db.String(30))
    TissueType = db.Column(db.String(30))
    TissueProcessing = db.Column(db.String(30))
    Condition = db.Column(db.String(30))
    ExtractionMethod = db.Column(db.String(50))
    RIN = db.Column(db.Float)
    DV200 = db.Column(db.Integer)
    DV200Classification = db.Column(db.String(30))
    QubitRNAConcentration = db.Column(db.Float)
    LibraryPrepMethod = db.Column(db.String(30))
    Sequencer = db.Column(db.String(30))


class Uploaders(db.Model):

    __table_args__ = (
        db.UniqueConstraint('UploadCenter','UploadUser',name='unique_center_user'),
    )
    UploadID = db.Column(db.Integer, primary_key = True)
    UploadCenter = db.Column(db.String(100), nullable=False)
    UploadUser = db.Column(db.String(100), nullable=False)
    uploadBy = db.relationship('Dataset2Uploaders',backref='uploaders',lazy='dynamic')
    enteredBy = db.relationship('Dataset',backref='uploaders',lazy='dynamic')

class Analysis(db.Model):

    AnalysisID = db.Column(db.Integer, primary_key = True)
    DatasetID = db.Column(db.Integer, db.ForeignKey('dataset.DatasetID', onupdate="cascade",ondelete="cascade"), nullable=False)
    PipelineVersion = db.Column(db.String(30))
    ResultsDirectory = db.Column(db.Text)
    ResultsBAM = db.Column(db.Text)
    AssignedTo = db.Column(db.String(100), nullable=True)
    RequestedDate = db.Column(db.Date, nullable=True)
    analysisStatuses = db.relationship('AnalysisStatus', backref='analysis', lazy='dynamic')

class AnalysisStatus(db.Model):
    
    __tablename__ = "analysisStatus"
    AnalysisID = db.Column(db.Integer, db.ForeignKey('analysis.AnalysisID', onupdate="cascade",ondelete="cascade"), nullable=False, primary_key = True)
    AnalysisStep = db.Column(db.String(45), nullable = False, primary_key = True)
    UpdateDate = db.Column(db.DateTime, nullable = False)
    UpdateUser = db.Column(db.Integer, db.ForeignKey('user.id', onupdate="cascade",ondelete="restrict"))
    Notes = db.Column(db.Text)


@login.user_loader
def load_user(id):
        return User.query.get(int(id))


