from app import db
from app.models import *
from sqlalchemy import update, desc
import datetime as dt
import os
import re


def fetch_cohorts(userid,accessLevel='Regular',project='ALL'):

    cohorts = {}
    cohortQuery = None

    if accessLevel == 'Admin':
        cohortQuery = db.session.query(Project,Cohort).join(Cohort)
    else:
        cohortQuery = db.session.query(Project,Projects2Users,Cohort).join(Projects2Users,Cohort).filter(Projects2Users.userID==userid)

    if project!='ALL':
        cohortQuery = cohortQuery.filter(Project.ProjectName==project)

    for result in cohortQuery.all():
        if result.Cohort.CohortID not in cohorts:
            cohorts[result.Cohort.CohortID] = result.Cohort.CohortName
    return cohorts 

def check_user_access(userid, datasetArr, accessLevel='Regular'):

    if accessLevel == 'Admin':
        return True

    for datasetID in datasetArr:
        if db.sesion.query(Project,Projects2Users,Cohort,Dataset).join(Projects2Users,Cohort).join(Dataset).filter(Projects2Users.userID==userid).filter(Dataset.DatasetID==datasetID).count() == 0:
            return False

    return True

def checkSampleRecordValues(sampleRow):

    reqFields = ['FamilyID','SampleName','SampleID','CohortName','ProjectName','DatasetType']
    for field in reqFields:
        if field not in sampleRow:
            return False
    if re.search(r"[^a-zA-Z.0-9_-]",str(sampleRow['FamilyID'])) or re.search(r"[^a-z.A-Z0-9_-]",str(sampleRow['SampleName'])): 
        return False
    return True

def checkCohortandProjectAccess(userid,accessLevel,sampleRow):

    if accessLevel!='Admin':

        #if cohort exists and the user doesnt have access to the cohort - return False
        if db.session.query(Cohort).filter(Cohort.CohortName==sampleRow['CohortName']).count()!=0:
            if db.session.query(Project,Projects2Users,Cohort).join(Projects2Users,Cohort).filter(Projects2Users.userID==userid).filter(Cohort.CohortName==sampleRow['CohortName']).count() == 0:
                return 'You dont have access to the cohort '+sampleRow['CohortName']

        #if project exists and the user doesnt have access to the project - return False
        if db.session.query(Project).filter(Project.ProjectName==sampleRow['ProjectName']).count()!=0:
            if db.session.query(Project,Projects2Users).join(Projects2Users).filter(Projects2Users.userID==userid).filter(Project.ProjectName==sampleRow['ProjectName']).count() == 0:
                return 'You dont have access to the project '+sampleRow['ProjectName']

    #if cohort exists but it belongs to a different project - return False
    cohort_project_query = db.session.query(Project,Cohort).join(Cohort).filter(Cohort.CohortName==sampleRow['CohortName'])
    if cohort_project_query.count() != 0:
        result = cohort_project_query.first()
        if result.Project.ProjectName.upper() != sampleRow['ProjectName'].upper():
            return 'Cohort '+sampleRow['CohortName']+' does not belong to the project '+ sampleRow['ProjectName']

    #finally return true
    return ''        

def checkSampleUpdateRecordValues(sampleRow):
    
    reqFields = ['SampleID','DatasetType','UploadDate','Status']
    for field in reqFields:
        if field not in sampleRow:
            return False
    return True

def famIDExists(famID):

    checkfamIDQuery = db.session.query(Family).filter(Family.FamilyID==famID)
    return checkfamIDQuery.count()

def insertFamID(famID):

    newFam = Family(FamilyID=famID)
    db.session.add(newFam)
 
def SampleIDExists(sampleID):
    
    checkSampleIDQuery = db.session.query(Sample).filter(Sample.SampleID==sampleID)
    return checkSampleIDQuery.count()

def updateSampleStatusinDB(**sampleRecord):

    if 'Notes' not in sampleRecord:
        sampleRecord['Notes']=None

    if SampleIDExists(sampleRecord['SampleID']) == 0:
        raise Exception('SampleID doesnt exist')
   
    analysisID = -1
    datasetExistsQuery = db.session.query(Dataset,Analysis).join(Analysis).filter(Dataset.SampleID==sampleRecord['SampleID']).filter(Dataset.DatasetType==sampleRecord['DatasetType']).filter(Analysis.RequestedDate==sampleRecord['UploadDate']).order_by(desc(Analysis.AnalysisID)).limit(1)
  
    if datasetExistsQuery.count() != 1:
        raise Exception('DatasetID doesnt exist')
    else:
        dataset = datasetExistsQuery.first()
        datasetID = dataset.Dataset.DatasetID
        analysisID = dataset.Analysis.AnalysisID
  
    datasetIDQuery = db.session.query(Dataset).filter(Dataset.DatasetID==datasetID)
    if 'InputFile' in sampleRecord and len(sampleRecord['InputFile']) >0:
        datasetIDQuery.update({'InputFile':sampleRecord['InputFile']})
    
    if sampleRecord['Notes'] != None:
        datasetIDQuery.update({'Notes': sampleRecord['Notes']})

    analysisIDQuery = db.session.query(Analysis).filter(Analysis.AnalysisID==analysisID)
    if analysisIDQuery.count() == 0:
        raise Exception('AnalysisID doesnt exist')
   
    Updatecolumns = ['PipelineVersion','ResultsDirectory','ResultsBAM']
    for column in Updatecolumns:
        if column in sampleRecord and sampleRecord[column]!='':
            analysisIDQuery.update({column: sampleRecord[column]})

    analysisStepQuery = db.session.query(AnalysisStatus).filter(AnalysisStatus.AnalysisID==analysisID).filter(AnalysisStatus.AnalysisStep==sampleRecord['Status'])
    if analysisStepQuery.count() == 0:
        newAnalysisStep = AnalysisStatus(AnalysisID=analysisID,AnalysisStep=sampleRecord['Status'],UpdateDate=sampleRecord['updateDate'],UpdateUser=sampleRecord['userID'])
        db.session.add(newAnalysisStep)

def insertSampleID(**sampleRow):

    gender = None
    sampleType = None
    PCID = None
    tissueType = None

    if 'Gender' in sampleRow:
        gender = sampleRow['Gender']
    if 'SampleType' in sampleRow:
        sampleType = sampleRow['SampleType']
    if 'PhenomeCentralSampleID' in sampleRow:
        PCID = sampleRow['PhenomeCentralSampleID']
    if 'TissueType' in sampleRow:
        tissueType = sampleRow['TissueType']
    
    newSample = Sample(SampleID=sampleRow['SampleID'], SampleName=sampleRow['SampleName'], Gender=gender, FamilyID=sampleRow['FamilyID'], SampleType=sampleType,PhenomeCentralSampleID=PCID, TissueType=tissueType)
    db.session.add(newSample)

def CohortIDExists(cohortName):

    cohortID = -1
    checkCohortQuery = db.session.query(Cohort).filter(Cohort.CohortName==cohortName).one_or_none()
    if checkCohortQuery is not None:
        cohortID = checkCohortQuery.CohortID

    return cohortID

def addDatasetandCohortInformation(**sampleRow):

    newCohort = None
    newDataset2CohortID = None
    uploadID = -1

    sampleRow['uploadDate'] = dt.datetime.now().strftime('%Y-%m-%d')

    if 'Notes' not in sampleRow:
        sampleRow['Notes'] = None
    if 'RunID' not in sampleRow:
        sampleRow['RunID'] = None

    if 'userName' in sampleRow:
        UploaderResult = db.session.query(Uploaders).filter(Uploaders.UploadUser==sampleRow['userName']).one_or_none()
        if UploaderResult is not None:
            uploadID = UploaderResult.UploadID
        else:
            raise Exception("User doesnt have upload access!")
    else:
        raise Exception("username not found in sampleRow")

    #check if project Exists:
    projectID = -1
    projectResult = db.session.query(Project).filter(Project.ProjectName==sampleRow['ProjectName']).first()    
    if projectResult is not None:
        projectID = projectResult.ProjectID
    else:
        newProject = Project(ProjectName=sampleRow['ProjectName'])
        newProjectUser = Projects2Users(userID=sampleRow['userID'])
        newProject.projects2User.append(newProjectUser)

    newDataset = None    
    if sampleRow['cohortID'] == -1:
        # if the cohort name doesnt exist - add row to Cohort and Dataset2Cohort table
        if projectID != -1:
            newCohort = Cohort(CohortName=sampleRow['CohortName'],ProjectID=projectID)
        else:
            newCohort = Cohort(CohortName=sampleRow['CohortName'])
            newProject.projects2Cohort.append(newCohort)
        newDataset2CohortID=Dataset2Cohort()
        newCohort.cohorts2Data.append(newDataset2CohortID)
        newDataset = Dataset(DatasetID=None,SampleID=sampleRow['SampleID'],UploadDate=sampleRow['uploadDate'],UploadStatus='Complete',UploadID=uploadID,DatasetType=sampleRow['DatasetType'],SolvedStatus='Unsolved',RunID=sampleRow['RunID'],Notes=sampleRow['Notes'])
        newCohort.cohorts2Dataset.append(newDataset)
    else:
        # if cohortID exists already
        newDataset2CohortID = Dataset2Cohort(CohortID=sampleRow['cohortID'])
        newDataset = Dataset(SampleID=sampleRow['SampleID'],UploadDate=sampleRow['uploadDate'],UploadStatus='Complete',UploadID=uploadID,DatasetType=sampleRow['DatasetType'],SolvedStatus='Unsolved',RunID=sampleRow['RunID'],Notes=sampleRow['Notes'],ActiveCohort=sampleRow['cohortID'])
   
    newAnalysis = Analysis(RequestedDate=sampleRow['uploadDate'])
    newAnalysisStatus = AnalysisStatus(AnalysisStep='pending',UpdateDate=sampleRow['updateDate'],UpdateUser=sampleRow['userID'])   

    newDataset.data2Cohorts.append(newDataset2CohortID)
    newAnalysis.analysisStatuses.append(newAnalysisStatus)
    newDataset.analyses.append(newAnalysis)

    if sampleRow['cohortID'] == -1: #if cohort doesnt exist
        if projectID == -1: #if project doesnt exist create it first 
            db.session.add(newProject)
        else: #if project exists cerate a new cohort under that project
            db.session.add(newCohort)
    else:
        db.session.add(newDataset)
