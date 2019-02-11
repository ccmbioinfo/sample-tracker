from app import db
from app.models import *
from sqlalchemy import update
import datetime as dt
import os
import re


def fetch_cohorts(username,accessLevel='Regular'):

    cohorts = {}
    if accessLevel == 'Regular':
        subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==username).subquery()
        results = db.session.query(Cohort,Dataset2Cohort,Dataset,Uploaders).join(Dataset2Cohort).join(Dataset).join(Uploaders).filter(Uploaders.UploadCenter==subQuery.c.UploadCenter).all()
        for result in results:
            if result.Cohort.CohortID not in cohorts:
                cohorts[result.Cohort.CohortID] = result.Cohort.CohortName
    else:
        for cohort in Cohort.query.order_by(Cohort.CohortID).all():
            cohorts[cohort.CohortID] = cohort.CohortName
    return cohorts
    
def checkSampleRecordValues(sampleRow):

    reqFields = ['FamilyID','SampleName','SampleID']
    for field in reqFields:
        if field not in sampleRow:
            return False
    if re.search(r"[^a-zA-Z.0-9_-]",str(sampleRow['FamilyID'])) or re.search(r"[^a-z.A-Z0-9_-]",str(sampleRow['SampleName'])): 
        return False
     
    return True
        
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
   
    if 'InputFile' in sampleRecord and len(sampleRecord['InputFile']) >0:
        datasetIDQuery = db.session.query(Dataset).filter(Dataset.SampleID==sampleRecord['SampleID']).filter(Dataset.DatasetType==sampleRecord['DatasetType']).filter(Dataset.UploadDate==sampleRecord['UploadDate'])
        if datasetIDQuery.count() != 1:
            raise Exception('DatasetID doesnt exist or has multiple hits')
        datasetIDQuery.update({'InputFile':sampleRecord['InputFile']})

    analysisID = sampleRecord['SampleID']+"_"+sampleRecord['DatasetType']+"_"+sampleRecord['UploadDate']
    analysisIDQuery = db.session.query(Analysis).filter(Analysis.AnalysisID==analysisID)
    if analysisIDQuery.count() == 0:
        raise Exception('AnalysisID doesnt exist')
   
    Updatecolumns = ['PipelineVersion','ResultsDirectory','ResultsBAM']
    for column in Updatecolumns:
        if column in sampleRecord and sampleRecord[column]!='':
            analysisIDQuery.update({column: sampleRecord[column]})

    analysisStepQuery = db.session.query(AnalysisStatus).filter(AnalysisStatus.AnalysisID==analysisID).filter(AnalysisStatus.AnalysisStep==sampleRecord['Status'])
    if analysisStepQuery.count() == 0:
        newAnalysisStep = AnalysisStatus(AnalysisID=analysisID,AnalysisStep=sampleRecord['Status'],UpdateDate=sampleRecord['updateDate'],UpdateUser=sampleRecord['userID'],Notes=sampleRecord['Notes'])
        db.session.add(newAnalysisStep)

def insertSampleID(**sampleRow):

    gender = None
    sampleType = None
    PCID = None
    if 'Gender' in sampleRow:
        gender = sampleRow['Gender']
    if 'SampleType' in sampleRow:
        sampleType = sampleRow['SampleType']
    if 'PhenomeCentralSampleID' in sampleRow:
        PCID = sampleRow['PhenomeCentralSampleID']
    newSample = Sample(SampleID=sampleRow['SampleID'], SampleName=sampleRow['SampleName'], Gender=gender, FamilyID=sampleRow['FamilyID'], SampleType=sampleType,PhenomeCentralSampleID=PCID)
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
    newCohort2Family = None
    uploadID = -1

    sampleRow['uploadDate'] = dt.datetime.now().strftime('%Y-%m-%d')

    if 'Notes' not in sampleRow:
        sampleRow['Notes'] = None
    if 'RunID' not in sampleRow:
        sampleRow['RunID'] = None

    if 'userName' in sampleRow:
        if sampleRow['accessLevel'] == 'Admin': #Admins can enter samples as other users.
            if 'UploadUser' in sampleRow and len(sampleRow['UploadUser']) > 0:
                tmpCenter,tmpUser = sampleRow['UploadUser'].split(':')
                sampleRow['userName'] = tmpUser
        UploaderResult = db.session.query(Uploaders).filter(Uploaders.UploadUser==sampleRow['userName']).one_or_none()
        if UploaderResult is not None:
            uploadID = UploaderResult.UploadID

    analysisID = sampleRow['SampleID']+"_"+sampleRow['DatasetType']+"_"+sampleRow['uploadDate']
        
    if sampleRow['cohortID'] == -1:
        # if the cohort name doesnt exist - add row to Cohort and Dataset2Cohort table
        newCohort = Cohort(CohortName=sampleRow['CohortName'])
        newDataset2CohortID=Dataset2Cohort()
        newCohort2Family=Cohort2Family(FamilyID=sampleRow['FamilyID'])
        newCohort.cohorts2Data.append(newDataset2CohortID)
        newCohort.cohorts.append(newCohort2Family)
    else:
        # if cohortID exists already
        newDataset2CohortID = Dataset2Cohort(CohortID=sampleRow['cohortID'])
        checkCohort2Family = db.session.query(Cohort2Family).filter(Cohort2Family.CohortID==sampleRow['cohortID']).filter(Cohort2Family.FamilyID==sampleRow['FamilyID']).one_or_none()
 
        if checkCohort2Family is None:
            newCohort2Family = Cohort2Family(CohortID=sampleRow['cohortID'],FamilyID=sampleRow['FamilyID'])
    
    newDataset = Dataset(DatasetID=None,SampleID=sampleRow['SampleID'],UploadDate=sampleRow['uploadDate'],UploadStatus='Complete',UploadID=uploadID,DatasetType=sampleRow['DatasetType'],SolvedStatus='Unsolved',RunID=sampleRow['RunID'],Notes=sampleRow['Notes'])
    newAnalysis = Analysis(AnalysisID=analysisID)
    newAnalysisStatus = AnalysisStatus(AnalysisStep='pending',UpdateDate=sampleRow['updateDate'],UpdateUser=sampleRow['userID'])   

    newDataset.data2Cohorts.append(newDataset2CohortID)
    newAnalysis.analysisStatuses.append(newAnalysisStatus)
    newDataset.analyses.append(newAnalysis)

    if sampleRow['cohortID'] == -1:
        db.session.add(newCohort)

    else:
        if newCohort2Family is not None:
            db.session.add(newCohort2Family)

    db.session.add(newDataset)
