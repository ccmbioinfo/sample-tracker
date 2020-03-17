from enum import Enum

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app import db


class User(UserMixin, db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(30), nullable=False, unique=True)
    password_hash = db.Column(db.String(200), nullable=False, unique=False)
    email = db.Column(db.String(150), nullable=False, unique=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256:50000")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Family(db.Model):
    family_id = db.Column(db.Integer, primary_key=True)
    # Family.FamilyID
    family_codename = db.Column(db.String(50), nullable=False, unique=True)
    participants = db.relationship('participant', backref='family_id', lazy='dynamic')


class Gender(Enum):
    Male = 'Male'
    Female = 'Female'
    Other = 'Other'


class ParticipantType(Enum):
    Proband = 'Proband'
    Parent = 'Parent'
    Sibling = 'Sibling'


class Participant(db.Model):
    participant_id = db.Column(db.Integer, primary_key=True)
    # Sample.SampleName
    participant_codename = db.Column(db.String(50), nullable=False, unique=True)
    # Sample.Gender
    gender = db.Column(db.Enum(Gender), nullable=False)
    # Sample.SampleType
    participant_type = db.Column(db.Enum(ParticipantType), nullable=False)
    # Sample.AffectedStatus
    affected = db.Column(db.Boolean, nullable=False)
    notes = db.Column(db.Text)
    notes_last_modified = db.Column(db.DateTime)
    notes_last_author = db.Column(db.Integer, db.ForeignKey('user.user_id'), onupdate='cascade')
    tissue_samples = db.relationship('tissue_sample', backref='participant_id', lazy='dynamic')


class TissueSampleType(Enum):
    Blood = 'Blood'


class TissueProcessing(Enum):
    FreshFrozen = 'FF'
    Formaldehyde = 'FFPE'


class TissueSample(db.Model):
    tissue_sample_id = db.Column(db.Integer, primary_key=True)
    extraction_date = db.Column(db.Date)
    # Sample.TissueType
    tissue_sample_type = db.Column(db.Enum(TissueSampleType), nullable=False)
    # RNASeqDataset.TissueProcessing
    tissue_processing = db.Column(db.Enum(TissueProcessing))
    # Dataset.SolvedStatus
    solved = db.Column(db.Boolean)
    datasets = db.relationship('dataset', backref='tissue_sample_id', lazy='dynamic')


class DatasetDiscriminator(Enum):
    Dataset = 'dataset'
    RNASeqDataset = 'rnaseq_dataset'


class DatasetType(Enum):
    CES = 'CES'
    CGS = 'CGS'
    CPS = 'CPS'
    RES = 'RES'
    RGS = 'RGS'
    RLM = 'RLM'
    RMM = 'RMM'
    RRS = 'RRS'
    RTA = 'RTA'
    WES = 'WES'
    RNASeq = 'RNASeq'  # RNA-Seq
    RCS = 'RCS'
    RDC = 'RDC'
    RDE = 'RDE'


# Name TBD
class DatasetCondition(Enum):
    Control = 'Control'
    GermLine = 'GermLine'  # e.g. rare diseases
    Somatic = 'Somatic'  # e.g. cancer


class DatasetExtractionProtocol(Enum):
    Something = 1


class DatasetReadType(Enum):
    PairedEnd = 'PairedEnd'
    SingleEnd = 'SingleEnd'


datasets_analyses_table = db.Table(
    'association', db.Model.metadata,
    db.Column('dataset_id', db.Integer, db.ForeignKey('dataset.dataset_id')),
    db.Column('analysis_id', db.Integer, db.ForeignKey('analysis.analysis_id'))
)


class Dataset(db.Model):
    __tablename__ = DatasetDiscriminator.Dataset
    # Dataset.DatasetID
    dataset_id = db.Column(db.Integer, primary_key=True)
    # Dataset.DatasetType
    dataset_type = db.Column(db.Enum(DatasetType), nullable=False)
    # Dataset.HPFPath
    input_hpf_path = db.Column(db.String(500), nullable=False)
    # Dataset.EnteredDate
    entered = db.Column(db.DateTime, nullable=False)
    # Dataset.EnteredBy
    entered_by = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False, onupdate='cascade')
    # Dataset.Notes
    notes = db.Column(db.Text)
    # Dataset.NotesLastUpdatedDate
    notes_last_modified = db.Column(db.DateTime)
    # Dataset.NotesLastUpdatedBy
    notes_last_author = db.Column(db.Integer, db.ForeignKey('user.user_id'), onupdate='cascade')
    # RNASeqDataset.Condition (name TBD)
    condition = db.Column(db.Enum(DatasetCondition), nullable=False)
    extraction_protocol = db.Column(db.Enum(DatasetExtractionProtocol), nullable=False)
    # RNASeqDataset.ExtractionMethod (guided dropdown or enum)
    capture_kit = db.Column(db.String(50))
    # RNASeq.LibraryPrepMethod (guided dropdown or enum)
    library_prep_method = db.Column(db.String(50))
    library_prep_date = db.Column(db.Date)
    read_length = db.Column(db.Integer)
    read_type = db.Column(db.Enum(DatasetReadType))
    sequencing_id = db.Column(db.String(50))
    sequencing_date = db.Column(db.Date)
    # Uploaders.UploadCenter
    sequencing_centre = db.Column(db.String(100), nullable=False)
    batch_id = db.Column(db.String(50))

    discriminator = db.Column(db.Enum(DatasetDiscriminator))
    __mapper_args__ = {
        'polymorphic_identity': DatasetDiscriminator.Dataset,
        'polymorphic_on': discriminator
    }

    analyses = db.relationship('analysis', secondary=datasets_analyses_table, backref='datasets', lazy='dynamic')


class RNASeqDataset(Dataset):
    __tablename__ = DatasetDiscriminator.RNASeqDataset
    dataset_id = db.Column(db.Integer, db.ForeignKey('dataset.dataset_id'), primary_key=True, onupdate='cascade',
                           ondelete='cascade')
    # RNASeqDataset.RIN
    RIN = db.Column(db.Float)
    # RNASeqDataset.DV200
    DV200 = db.Column(db.Integer)
    # RNASeqDataset.QubitRNAConcentration
    concentration = db.Column(db.Float)
    # RNASeqDataset.Sequencer (guided dropdown or enum)
    sequencer = db.Column(db.String(50))
    spike_in = db.Column(db.String(50))

    __mapper_args__ = {
        'polymorphic_identity': DatasetDiscriminator.RNASeqDataset
    }


class AnalysisState(Enum):
    Requested = 'Requested'
    Running = 'Running'
    Done = 'Done'
    Error = 'Error'


class Analysis(db.Model):
    # Analysis.AnalysisID
    analysis_id = db.Column(db.Integer, primary_key=True)
    # AnalysisStatus.AnalysisStep
    analysis_state = db.Column(db.Enum(AnalysisState), nullable=False)
    pipeline_id = db.Column(db.Integer, db.ForeignKey('pipeline.pipeline_id'), nullable=False, onupdate='cascade',
                            ondelete='restrict')
    # Dataset.RunID
    qsub_id = db.Column(db.Integer)
    # Analysis.ResultsDirectory
    result_hpf_path = db.Column(db.String(500))
    # AnalysisStatus.UpdateDate
    last_updated = db.Column(db.DateTime, nullable=False)
    # AnalysisStatus.UpdateUser
    last_updated_by = db.Column(db.Integer, db.ForeignKey('user.user_id'), onupdate='cascade')
    # Analysis.RequestedDate
    requested = db.Column(db.DateTime)
    started = db.Column(db.DateTime)
    finished = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    notes_last_modified = db.Column(db.DateTime)
    notes_last_author = db.Column(db.Integer, db.ForeignKey('user.user_id'), onupdate='cascade')


class Pipeline(db.Model):
    pipeline_id = db.Column(db.Integer, primary_key=True)
    pipeline_name = db.Column(db.String(50), nullable=False)
    pipeline_version = db.Column(db.String(50), nullable=False)
    __table_args__ = (
        db.UniqueConstraint('pipeline_name', 'pipeline_version')
    )


class PipelineDatasets(db.Model):
    pipeline_id = db.Column(db.Integer, db.ForeignKey('pipeline.pipeline_id'), primary_key=True, onupdate='cascade',
                            ondelete='restrict')
    supported_dataset = db.Column(db.Enum(DatasetType), primary_key=True)
