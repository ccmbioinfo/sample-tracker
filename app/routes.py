from flask import send_file,render_template, flash, redirect, url_for, request
from flask_login import login_user, logout_user, current_user, login_required
from app import app,db
from app.models import *
from app.loginform import LoginForm
from sqlalchemy.sql import func
from sqlalchemy import update
from app.non_route_functions import *
from flask_wtf.csrf import CSRFError

import time
import datetime as dt
import random
import json
import os

@app.route('/', methods=('GET','POST'))
@app.route('/login', methods=('GET','POST'))
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            return render_template('Login.html',title="Login",error="Incorrect Username/Password combination",form=form)
        login_user(user)
        return redirect(url_for('index'))

    return render_template('Login.html',title="Login",error=0, form=form)

@app.route("/SearchBox")
@app.route("/CohortStats")
@app.route("/SampleUploader")
@login_required
def redirect_to_index():
    return redirect(url_for('index'))

@app.route("/get_logged_user")
@login_required
def get_logged_user():
    user_obj = {}
    if current_user.is_authenticated:
        user_obj['username'] = current_user.username
        user_obj['accessLevel'] = current_user.accessLevel.value
        return json.dumps(user_obj)

@app.route("/index")
@login_required
def index():
	return render_template("index.html",username=current_user.username)

@app.route("/files/uploadTemplate")
@login_required
def uploadTemplate():

    if  current_user.accessLevel.value == 'Admin':
        return send_file(os.path.dirname(app.instance_path)+"/static/files/upload_admin.xls") 
    return send_file(os.path.dirname(app.instance_path)+"/static/files/upload.xls") 

@app.route("/files/updateTemplate")
@login_required
def updateTemplate():

    if  current_user.accessLevel.value == 'Admin':
        return send_file(os.path.dirname(app.instance_path)+"/static/files/update.xls") 

@app.route('/fetch/cohort_list')
@login_required
def get_cohorts():

    return json.dumps(fetch_cohorts(current_user.username,current_user.accessLevel.value),default=str)

@app.route('/fetch/uploadCenter_list')
@login_required
def get_uploadCenterList():

    uploaders = []
    query = db.session.query(Uploaders.UploadCenter)

    if current_user.accessLevel.value == 'Regular':
        query  = query.filter(Uploaders.UploadUser==current_user.username)

    results = query.distinct().all() 
    for uploader in results:
        uploaders.append(uploader.UploadCenter)

    return json.dumps(uploaders,default=str)

@app.route('/fetch/uploadCenterUser_list')
@login_required
def get_uploadCenterUserList():

    uploaders = []
    query = db.session.query(Uploaders)

    if current_user.accessLevel.value == 'Regular':
        query  = query.filter(Uploaders.UploadUser==current_user.username)

    results = query.distinct().all() 
    for uploader in results:
        uploaders.append(uploader.UploadCenter+":"+uploader.UploadUser)

    return json.dumps(uploaders,default=str)

@app.route('/fetch/DatasetType')
@login_required
def get_datasetType():

    datasets = []
    for dataset in db.session.query(Dataset.DatasetType).distinct().all():
        datasets.append(dataset.DatasetType)
    return json.dumps(datasets,default=str)

@app.route('/fetch/PipelineVersions')
@login_required
def get_pipelineVersions():

    pipelineVersions = []
    for version in db.session.query(Analysis.PipelineVersion).distinct().all():
        pipelineVersions.append(version.PipelineVersion)
    return json.dumps(pipelineVersions,default=str)

@app.route('/fetch/uploadUser_list')
@login_required
def get_uploadUserList():

    uploadUsers = []
    query = db.session.query(Uploaders.UploadUser)

    if current_user.accessLevel.value == 'Regular':
        subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
        query = query.filter(Uploaders.UploadCenter==subQuery.c.UploadCenter)    

    for uploader in query.all():
        uploadUsers.append(uploader.UploadUser)

    return json.dumps(uploadUsers,default=str)

@app.route('/fetch/userList')
@login_required
def get_userList():

    users = []
    query = db.session.query(User.username)
    if current_user.accessLevel.value != 'Regular':
        for userName in query.all():
            users.append(userName[0])
    return json.dumps(users,default=str)

@app.route('/fetchFamilyInfo/<familyID>')
@login_required
def fetchFamilyInfo(familyID):
	
	family = {"probands":[],"parents":[]}
	results = db.session.query(Family,Sample).join(Sample).filter(Family.FamilyID==familyID).all()
	for row in results:
		if row.Sample.SampleType!= None:
			if row.Sample.SampleType.lower() == 'proband':
				family['probands'].append({"Sample":row.Sample.SampleName,"Gender":row.Sample.Gender})
			elif row.Sample.SampleType.lower() in ('parent','mother','father'):
				family['parents'].append({"Sample":row.Sample.SampleName,"Gender":row.Sample.Gender})

	return json.dumps(family,default=str)

@app.route('/fetchDatasets/<sampleID>')
@login_required
def fetchDatasets(sampleID):

    datasets = []
    results = db.session.query(Dataset,Uploaders).join(Uploaders).filter(Dataset.SampleID==sampleID).all()
    for row in results:
        cohorts = []
        cohortResult = db.session.query(Cohort,Dataset2Cohort).join(Dataset2Cohort).filter(Dataset2Cohort.DatasetID==row.Dataset.DatasetID)
        for cohort in cohortResult:
            cohorts.append(cohort.Cohort.CohortName)
        analyses = {}
        analysisResults = db.session.query(Analysis).filter(Analysis.DatasetID==row.Dataset.DatasetID).all()
        for analysisRow in analysisResults:
            analysisDetails = fetchAnalysisHistory(analysisRow.AnalysisID)
            analyses[analysisRow.AnalysisID] = json.loads(analysisDetails)

        datasets.append({"DatasetID":row.Dataset.DatasetID, "Cohorts": cohorts, "Analyses": analyses, "DatasetType": row.Dataset.DatasetType, "UploadDate": row.Dataset.UploadDate, "UploadStatus": row.Dataset.UploadStatus, "UploadCenter": row.Uploaders.UploadCenter, "UploadUser": row.Uploaders.UploadUser, "InputFile": row.Dataset.InputFile, "RunID": row.Dataset.RunID, "HPFPath": row.Dataset.HPFPath, "SolvedStatus": row.Dataset.SolvedStatus,"Notes": row.Dataset.Notes })		
    return json.dumps(datasets,default=str)

@app.route('/fetchAnalysisHistory/<analysisID>')
@login_required
def fetchAnalysisHistory(analysisID):
	
    analysisHistory = {'PipelineVersion':'', 'history': []}
    results = db.session.query(Analysis,AnalysisStatus,User).join(AnalysisStatus).join(User).filter(Analysis.AnalysisID==analysisID).order_by(AnalysisStatus.UpdateDate.desc()).all()
    for row in results:
        analysisHistory['PipelineVersion'] = row.Analysis.PipelineVersion
        analysisHistory['ResultsDirectory'] = row.Analysis.ResultsDirectory
        analysisHistory['ResultsBAM'] = row.Analysis.ResultsBAM
        analysisHistory['history'].append([row.AnalysisStatus.AnalysisStep, row.AnalysisStatus.UpdateDate, row.User.username, row.AnalysisStatus.Notes])

    return json.dumps(analysisHistory,default=str)

@app.route('/checkAndFetchSampleInformation/<SampleID>')
@login_required
def checkAndFetchSampleInformation(SampleID):
   
    results = None
    if  current_user.accessLevel.value == 'Admin':
        results = db.session.query(Sample,Dataset,Uploaders).join(Dataset).join(Uploaders).filter(Sample.SampleID==SampleID).all()
    else:
        subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
        results = db.session.query(Sample,Dataset,Uploaders).join(Dataset).join(Uploaders).filter(Sample.SampleID==SampleID).filter(Uploaders.UploadCenter==subQuery.c.UploadCenter).all()

    gender = ''
    for row in results:
        if row.Sample.Gender is not None:
            gender = row.Sample.Gender.value
        if current_user.accessLevel.value == 'Admin':
            return json.dumps({'Gender': gender,'SampleType': row.Sample.SampleType,'UploadUser': row.Uploaders.UploadCenter+":"+row.Uploaders.UploadUser},default=str)
        return json.dumps({'Gender': gender,'SampleType': row.Sample.SampleType},default=str)
    return json.dumps({},default=str)

@app.route('/checkIFSampleExists/<SampleID>')
@login_required
def checkIFSampleExists(SampleID):
   
    if current_user.accessLevel.value == 'Regular':
        return json.dumps({},default=str) 
    results = db.session.query(Sample).filter(Sample.SampleID==SampleID).all()
    if len(results) == 1:
        return json.dumps({'Exists':1},default=str)
    return json.dumps({'Exists':0},default=str)

@app.route('/fetch/UploadUserSamples/<CohortName>')
@login_required
def get_upload_user_samples(CohortName):

    samples = []
    #subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
    #results = db.session.query(Cohort,Cohort2Family,Family,Sample,Dataset,Uploaders,Analysis,AnalysisStatus).join(Cohort2Family).join(Family).join(Sample).join(Dataset).join(Uploaders,Analysis).join(AnalysisStatus).filter(Cohort.CohortName==CohortName).filter(Uploaders.UploadCenter==subQuery.c.UploadCenter).order_by(Dataset.UploadDate.desc()).all()
    results = db.session.query(Cohort,Cohort2Family,Family,Sample,Dataset,Uploaders,Analysis,AnalysisStatus).join(Cohort2Family).join(Family).join(Sample).join(Dataset).join(Uploaders,Analysis).join(AnalysisStatus).filter(Cohort.CohortName==CohortName).order_by(Dataset.UploadDate.desc()).all()
    addedDatasets = []
    for row in results:
        modifyIndex = -1
        if row.Dataset.DatasetID in addedDatasets:
            modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
        if modifyIndex == -1:
            samples.append({'FamilyID': row.Family.FamilyID, 'SampleName': row.Sample.SampleName,'PhenomeCentralSampleID': row.Sample.PhenomeCentralSampleID,'InputFile': row.Dataset.InputFile, 'id':row.Dataset.DatasetID, 'DatasetType':row.Dataset.DatasetType,'UploadDate': row.Dataset.UploadDate, 'AnalysisID': row.AnalysisStatus.AnalysisID,'AnalysisDate': row.AnalysisStatus.UpdateDate, 'Status': row.Dataset.SolvedStatus, 'AnalysisStatus': row.AnalysisStatus.AnalysisStep, 'InputFile': row.Dataset.InputFile, 'ResultsDirectory': row.Analysis.ResultsDirectory, 'ResultsBAM': row.Analysis.ResultsBAM});
            addedDatasets.append(row.Dataset.DatasetID)
        else:
            if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
                samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
                samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
                samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
    return json.dumps(samples,default=str)

@app.route('/fetch/search_cohort/<searchterm>/<searchvalue>')
@login_required
def get_samples_in_cohort(searchterm,searchvalue):
	
    samples = []
    results = []

    subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
    cohortbaseQuery = db.session.query(Cohort,Cohort2Family,Family,Sample,Dataset,Dataset2Cohort,Uploaders,Analysis,AnalysisStatus).join(Cohort2Family).join(Family).join(Sample).join(Dataset).join(Dataset2Cohort,Uploaders,Analysis).join(AnalysisStatus)

    if current_user.accessLevel.value == 'Regular':
        cohortbaseQuery = cohortbaseQuery.filter(Uploaders.UploadCenter==subQuery.c.UploadCenter)

    if searchterm == 'cohortSelect':
        if searchvalue == 'ALL':
            results = cohortbaseQuery.all()
        else:
            cohortID = -1
            cohortIDResult =db.session.query(Cohort).filter(Cohort.CohortName==searchvalue).all()
            for cohortResult in cohortIDResult:
                cohortID=cohortResult.CohortID
 
            results = cohortbaseQuery.filter(Cohort.CohortName==searchvalue).filter(Dataset2Cohort.CohortID==cohortID).all()

    elif searchterm == 'familySelect':
        for family_id in searchvalue.split(','):
            family_id = family_id.strip()
            results.extend(cohortbaseQuery.filter(Family.FamilyID==family_id).all())
            #results = cohortbaseQuery.filter(Family.FamilyID==searchvalue).all()

    elif searchterm == 'sampleSelect':
        for sample_id in searchvalue.split(','):
            sample_id = sample_id.strip()
            results.extend(cohortbaseQuery.filter(Sample.SampleName==sample_id).all())
            #results = cohortbaseQuery.filter(Sample.SampleName==searchvalue).all()

    elif searchterm == 'datasetTypeSelect':
            if searchvalue == 'ALL':
                results = cohortbaseQuery.all()
            else:
                results = cohortbaseQuery.filter(Dataset.DatasetType==searchvalue).all()

    elif searchterm == 'assignedToSelect':
            if searchvalue == 'ALL':
                results = cohortbaseQuery.all()
            else:
                results = cohortbaseQuery.filter(Analysis.AssignedTo==searchvalue).all() 

    elif searchterm == 'pipelineSelect':
        results = cohortbaseQuery.filter(Analysis.PipelineVersion==searchvalue).all()        

    elif searchterm == 'uploadCenterSelect':
        if searchvalue=='ALL':
            results = cohortbaseQuery.all()
        else:
            results = cohortbaseQuery.filter(Uploaders.UploadCenter==searchvalue).all()

    elif searchterm == 'uploadUserSelect':
        if searchvalue=='ALL':
            results = cohortbaseQuery.all()
        else:
            results = cohortbaseQuery.filter(Uploaders.UploadUser==searchvalue).all()

    elif searchterm == 'uploadSelect':
        results = cohortbaseQuery.filter(Dataset.UploadStatus==searchvalue).all()

    elif searchterm == 'resultSelect':
        results = cohortbaseQuery.filter(Dataset.SolvedStatus==searchvalue).all()

    elif searchterm == 'analysisSelect':
        results = cohortbaseQuery.all()
    else:
        pass

    addedDatasets = [] 
    for row in results:
        modifyIndex = -1
        if row.Dataset.DatasetID in addedDatasets: # if dataset is already added, get its index and check if current analysis date is higher than the previous
            modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
        if modifyIndex == -1:
            samples.append({'Sample': row.Sample.SampleName,'SampleID': row.Sample.SampleID, 'datasetID':row.Dataset.DatasetID, 'datasetType':row.Dataset.DatasetType,'UploadDate': row.Dataset.UploadDate, 'AnalysisDate': row.AnalysisStatus.UpdateDate, 'AnalysisID': row.AnalysisStatus.AnalysisID, 'Status': row.Dataset.SolvedStatus, 'AnalysisStatus': row.AnalysisStatus.AnalysisStep, 'FamilyID': row.Family.FamilyID, 'AssignedTo': row.Analysis.AssignedTo});
            addedDatasets.append(row.Dataset.DatasetID)
        else:
            if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
                samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
                samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
                samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
    if searchterm=='analysisSelect':
        samples = list(filter(lambda record: record['AnalysisStatus'].lower() == searchvalue.lower(),samples)) 
    return json.dumps(samples,default=str)


@app.route('/fetch/search_cohort_by_date/<dateType>/<startDate>/<endDate>')
@login_required
def get_samples_in_cohort_by_date(dateType,startDate,endDate):

    samples = []
    if (startDate == '0' and endDate == '0') or (startDate.isdigit() == False or endDate.isdigit() == False) :
        return json.dumps(samples,default=str)

    startDate, endDate = int(startDate), int(endDate)
    if startDate!=0:
        startDate = dt.datetime.utcfromtimestamp(startDate/1000).strftime("%Y-%m-%d")
    if endDate!=0:
        endDate = dt.datetime.utcfromtimestamp(endDate/1000).strftime("%Y-%m-%d")	
    else:
        endDate = dt.datetime.utcfromtimestamp(time.time()).strftime("%Y-%m-%d")

    subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
    cohortbaseQuery = db.session.query(Cohort,Cohort2Family,Family,Sample,Dataset,Dataset2Cohort,Uploaders,Analysis,AnalysisStatus).join(Cohort2Family).join(Family).join(Sample).join(Dataset).join(Dataset2Cohort,Uploaders,Analysis).join(AnalysisStatus)
    

    if current_user.accessLevel.value == 'Regular':
        cohortbaseQuery = cohortbaseQuery.filter(Uploaders.UploadCenter==subQuery.c.UploadCenter)

    if dateType == 'analysisDate':
        results = cohortbaseQuery.filter(AnalysisStatus.AnalysisStep == 'done').filter(AnalysisStatus.UpdateDate >= startDate).filter(AnalysisStatus.UpdateDate <= endDate).all()
    elif dateType == 'uploadDate':
        results = cohortbaseQuery.filter(Dataset.UploadStatus == 'complete').filter(Dataset.UploadDate >= startDate).filter(Dataset.UploadDate <=endDate).all()
    addedDatasets = []
    for row in results:
        modifyIndex = -1
        if row.Dataset.DatasetID in addedDatasets: # if dataset is already added, get its index and check if current analysis date is higher than the previous
            modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
        if modifyIndex == -1:
            samples.append({'Sample': row.Sample.SampleName,'SampleID': row.Sample.SampleID, 'datasetID':row.Dataset.DatasetID, 'datasetType':row.Dataset.DatasetType,'UploadDate': row.Dataset.UploadDate, 'AnalysisDate': row.AnalysisStatus.UpdateDate, 'AnalysisID': row.AnalysisStatus.AnalysisID, 'Status': row.Dataset.SolvedStatus, 'AnalysisStatus': row.AnalysisStatus.AnalysisStep, 'FamilyID': row.Family.FamilyID, 'AssignedTo': row.Analysis.AssignedTo});
            addedDatasets.append(row.Dataset.DatasetID)
        else:
             if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
                samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
                samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
                samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
    return json.dumps(samples,default=str)
	

@app.route('/checkInputForm/<field>/<value>')
@login_required
def checkInputForm(field,value):

    if  current_user.accessLevel.value == 'Admin':
        return json.dumps({'Status': 'Success'},default=str) 
    retValue = 1;
    existsQuery = ''
    subQuery =  db.session.query(Uploaders).filter(Uploaders.UploadUser==current_user.username).subquery()
    if field == 'FamilyID':
        existsQuery = db.session.query(Family,Sample,Dataset,Uploaders).join(Sample).join(Dataset).join(Uploaders).filter(Sample.FamilyID==value).filter(Uploaders.UploadCenter!=subQuery.c.UploadCenter)
    elif field == 'SampleName':
        existsQuery = db.session.query(Family,Sample,Dataset,Uploaders).join(Sample).join(Dataset).join(Uploaders).filter(Sample.SampleName==value).filter(Uploaders.UploadCenter!=subQuery.c.UploadCenter)
    elif field == 'CohortName':
        existsQuery = db.session.query(Cohort,Dataset2Cohort,Dataset,Uploaders).join(Dataset2Cohort).join(Dataset).join(Uploaders).filter(Cohort.CohortName==value).filter(Uploaders.UploadCenter!=subQuery.c.UploadCenter)
    else:
        return json.dumps({'Status': 'Success'},default=str)
   
    if existsQuery.count() == 0:
        return json.dumps({'Status': 'Success'},default=str)
        
    return json.dumps({'Status': 'Error'},default=str)
 

@app.route('/checkUpdateSamples',methods=["POST"])
@login_required
def checkUpdateSamples():

    postObj = {}
    retStr = {'Errors': []}
    if request.method == 'POST':
        postObj = request.get_json()
    else:
        return json.dumps({'Error': 'RequestError'},default=str)
    if 'samples' in postObj:
        for sampleRecord in postObj['samples']:
            if 'SampleID' in sampleRecord and 'DatasetType' in sampleRecord and 'UploadDate' in sampleRecord:
                analysisID = sampleRecord['SampleID']+"_"+sampleRecord['DatasetType']+"_"+sampleRecord['UploadDate']
                checkAnalysis = db.session.query(Analysis).filter(Analysis.AnalysisID==analysisID).all()
                if len(checkAnalysis) == 0:
                    retStr['Errors'].append("Cannot find dataset matching Sample: "+sampleRecord['SampleID']+" , Type: "+sampleRecord['DatasetType']+", UploadDate: "+sampleRecord['UploadDate'])
                else:
                    checkAnalysisStatus = db.session.query(AnalysisStatus).filter(AnalysisStatus.AnalysisID==analysisID).filter(AnalysisStatus.AnalysisStep=="done").all()
                    if len(checkAnalysisStatus) == 1:
                        retStr['Errors'].append("Dataset matching Sample: "+sampleRecord['SampleID']+" , Type: "+sampleRecord['DatasetType']+", UploadDate: "+sampleRecord['UploadDate']+" is already marked as 'done' in the database. Please contact Teja to update it.")
            else:
                retStr['Errors'].append("Sample " + SampleID + "is missing some data")  
    else:
        retStr['Errors'].append('No data!')             
    return json.dumps(retStr,default=str)

@app.route('/fetch/cohort/<projectid>/<sampleid>')
@login_required
def get_sampleinfo_in_cohort(projectid,sampleid):

    results = list(sampleDB[projectid].find({'Sample':sampleid},{'_id':0,'Sample':0,'Status':0,'Bioinf analysis':0,'Family_id':0}))
    return json.dumps(results,default=str)

@app.route('/fetch/cohort_stats')
@login_required
def get_cohort_stats():

    cohorts = []
    for cohortID,cohortName in fetch_cohorts(current_user.username,current_user.accessLevel.value).items(): 
        tmpObj = {}
        tmpObj['CohortName'] = cohortName
        tmpObj['Families'] = db.session.query(Cohort,Cohort2Family).join(Cohort2Family).filter(Cohort.CohortName==cohortName).count() 
        tmpObj['Samples'] = db.session.query(Cohort,Cohort2Family,Family,Sample).join(Cohort2Family).join(Family).join(Sample).filter(Cohort.CohortName==cohortName).count()
        tmpObj['pendingSamples']=[]
        pendingResults = db.session.query(Dataset2Cohort,Dataset,Analysis).join(Dataset).join(Analysis).filter(Dataset2Cohort.CohortID==cohortID).filter(Analysis.ResultsDirectory==None).all()
        for result in pendingResults:
            if result.Dataset.SampleID not in tmpObj['pendingSamples']:
                tmpObj['pendingSamples'].append(result.Dataset.SampleID)

        tmpObj['Processed'] = int(tmpObj['Samples']) - len(tmpObj['pendingSamples'])    
        cohorts.append(tmpObj)

    return json.dumps(cohorts,default=str)

@app.route('/requestReanalysis',methods=["POST"])
@login_required
def requestReanalysis():
    
        postObj = {}
        retStr = {'Status':'Error'}
        if request.method == 'POST':
            postObj = request.get_json()
        else:
            return json.dumps(retStr,default=str)

        today_date = dt.datetime.now().strftime('%Y-%m-%d')
        today = dt.datetime.now().strftime('%Y-%m-%d  %H:%M:%S')
        updateSuccess = 1
        if 'Samples'in postObj:
            for dataset in postObj['Samples']:
                analysisID = -1
                if 'datasetID' in dataset:
                    analysisID = dataset['SampleID']+"_"+dataset['datasetType']+"_"+today_date
                    try:
                        newAnalysis = Analysis(AnalysisID=analysisID,DatasetID=dataset['datasetID'])
                        Notes = None
                        if 'reAnalysisNotes' in dataset:
                            Notes = dataset['reAnalysisNotes']
                        newAnalysisStatus = AnalysisStatus(AnalysisID=analysisID,AnalysisStep='Reanalysis requested',UpdateDate=today,UpdateUser=current_user.id,Notes=Notes)
                        newAnalysis.analysisStatuses.append(newAnalysisStatus)
                        db.session.add(newAnalysis)
                    except:
                        updateSuccess = 0
                else:
                    updateSuccess = 0
        else:
            updateSuccess = 0

        if updateSuccess  == 1:
        #commit transaction here.
            try:
                db.session.commit()
                return json.dumps({"Status":"Success"},default=str)
            except:
                db.session.rollback()
        else:
            db.session.rollback()
        
        return json.dumps(retStr,default=str)    

@app.route('/updateAnalysisStatus',methods=["POST"])
@login_required
def updateAnalysisStatus():

        postObj = {}
        retStr = {'Status':'Error'}
        if request.method == 'POST':
            postObj = request.get_json()

        else:
            return json.dumps(retStr,default=str)
  
        if  current_user.accessLevel.value == 'Regular': #only Admin level users can updateAnalysisStatus
            return  json.dumps(retStr,default=str) 
        # check for postObj updateTo values in allowed set
        today = dt.datetime.now().strftime('%Y-%m-%d  %H:%M:%S') 
        updateSuccess = 1
        newStatusRows = []
        if 'datasets' in postObj and 'updateTo' in postObj:

            for dataSet in postObj['datasets']:
                if 'analysisID' in dataSet:
                    checkStatusQuery = AnalysisStatus.query.filter(AnalysisStatus.AnalysisID==dataSet['analysisID']).filter(AnalysisStatus.AnalysisStep==postObj['updateTo'])
                    if checkStatusQuery.count() == 1:
                        try:
                            checkStatusQuery.update({'UpdateDate':today,'UpdateUser': current_user.id})
                        except:
                            updateSuccess = 0
                            break
                    else:
                        newStatusRows.append(AnalysisStatus(AnalysisID=dataSet['analysisID'],AnalysisStep=postObj['updateTo'],UpdateDate=today,UpdateUser=current_user.id))
        
        if updateSuccess == 1:

            db.session.bulk_save_objects(newStatusRows)
            try:
                db.session.commit()
                retStr['Status'] = 'Success'
            except:
                db.session.rollback()
                retStr['Status'] = 'Failure'
        else:
            db.session.rollback()
            retStr['Status'] = 'Failure'

        return json.dumps(retStr,default=str)

@app.route('/updateSolvedStatus',methods=["POST"])
@login_required
def updateSolvedStatus():

        postObj = {}
        retStr = {'Status':'Error'}
        if request.method == 'POST':
            postObj = request.get_json()

        else:
            return json.dumps(retStr,default=str)
  
        if  current_user.accessLevel.value == 'Regular': #only Admin level users can updateSolvedStatus
            return  json.dumps(retStr,default=str) 
        # check for postObj updateTo values in allowed set
        updateSuccess = 1
        if 'datasets' in postObj and 'updateTo' in postObj:

            for dataSet in postObj['datasets']:
                if 'datasetID' in dataSet:
                    try:
                        db.session.query(Dataset).filter(Dataset.DatasetID==dataSet['datasetID']).update({'SolvedStatus': postObj['updateTo']})
                    except:
                        updateSuccess = 0
                        break

        if updateSuccess == 1:
            try:
                db.session.commit()
                retStr['Status'] = 'Success'
            except:
                db.session.rollback()
                retStr['Status'] = 'Failure'
        else:
            db.session.rollback()
            retStr['Status'] = 'Failure'

        return json.dumps(retStr,default=str)
        
@app.route('/addDatasets2Cohort',methods=["POST"])
@login_required
def addDatasets2Cohort():

    postObj= {}
    retStr= {'Status': 'Error adding samples to cohort. Please contact administrator!'}
    if request.method == 'POST':
        postObj = request.get_json()

    else:
        return json.dumps(retStr,default=str)

    newOrUpdate = 'new'
    cohortID = -1

    if 'add2ExistingCohort' in postObj and len(postObj['add2ExistingCohort']) >0:
        newOrUpdate = 'existing'
        cohortID = postObj['add2ExistingCohort'] 

    else:
        if 'add2NewCohort' in postObj and len(postObj['add2NewCohort']) >=5:
            if postObj['add2NewCohort'] in fetch_cohorts(current_user.username,current_user.accessLevel.value).values():
                return json.dumps({"Status": "Cohort name already exists. Please enter a new name"},default=str)
            CohortNameTakenbyOtherLab = json.loads(checkInputForm('CohortName',postObj['add2NewCohort']))
            if CohortNameTakenbyOtherLab['Status']!='Success':
                return json.dumps({"Status": "This cohort name is being used by another lab. Please enter a new name."},default="str")
        else:
            return json.dumps({"Status": "Cohort name needs to be atleast 5 characters."},default="str")

    newFamilyCohorts = []
    updateSuccess = 1

    if 'datasets' in postObj:
            
        if newOrUpdate == 'new': 
            try:
                NewCohort = Cohort(CohortName=postObj['add2NewCohort'])
            except:
                db.session.rollback()
                return json.dumps(retStr,default=str)          
        for dataset in postObj['datasets']:
            if 'datasetID' in dataset:
                if newOrUpdate == 'new':
                    try:
                        NewCohort.cohorts2Data.append(Dataset2Cohort(DatasetID=dataset['datasetID']))           
                    except:
                        updateSuccess=0
                        break
                else:
                    checkDatasetCohortQuery = Dataset2Cohort.query.filter(Dataset2Cohort.DatasetID==dataset['datasetID']).filter(Dataset2Cohort.CohortID==cohortID)
                    if checkDatasetCohortQuery.count() == 0:
                        try:
                            db.session.add(Dataset2Cohort(DatasetID=dataset['datasetID'],CohortID=cohortID))
                        except:       
                            updateSuccess=0
                            break

            if 'FamilyID' in dataset:
                if dataset['FamilyID'] not in newFamilyCohorts:
                    newFamilyCohorts.append(dataset['FamilyID'])
    
        for famID in newFamilyCohorts:
            if newOrUpdate == 'new':
                try:
                    NewCohort.cohorts.append(Cohort2Family(FamilyID=famID))
                except:
                    updateSuccess=0
                    break
            else:
                checkFamilyCohortQuery = Cohort2Family.query.filter(Cohort2Family.CohortID==cohortID).filter(Cohort2Family.FamilyID==famID)
                if checkFamilyCohortQuery.count() == 0:
                    try:
                        db.session.add(Cohort2Family(CohortID=cohortID,FamilyID=famID))
                    except:
                        updateSuccess=0
                        break
        if newOrUpdate == 'new':
            try:
                db.session.add(NewCohort)
            except:
                updateSuccess=0
                
        if updateSuccess  == 1:
            #commit transaction here.
            try:
                db.session.commit()
                return json.dumps({"Status":"Successfully added selected samples to cohort."},default=str)
            except:
                db.session.rollback()
        else:
            db.session.rollback()
        
    return json.dumps(retStr,default=str) 

@app.route('/insertNewSamplesintoDatabase',methods=["POST"])
@login_required
def insertNewSamplesintoDatabase():
    
    sampleObj = {}
    today = dt.datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d %H:%M:%S")
    retStr= {'Status': 'Error'}
    if request.method == 'POST':
        sampleObj = request.get_json()
    else:
        return json.dumps(sampleObj,default=str)

    if 'samples' in sampleObj:
        for sampleRecord in sampleObj['samples']:
            if checkSampleRecordValues(sampleRecord) == False:
                return json.dumps({'Status': 'Error'},default=str);
    success = 1
    if 'samples' in sampleObj:
        for sampleRecord in sampleObj['samples']:      
  
            if famIDExists(sampleRecord['FamilyID']) == 0:
                #insert familyID into database here.
                try:
                    insertFamID(sampleRecord['FamilyID'])
                except:
                    success = 0
                    break
            if SampleIDExists(sampleRecord['SampleID']) == 0:
                try:
                    insertSampleID(**sampleRecord)
                except:
                    success = 0
                    break
            if 'CohortName' not in sampleRecord:
                sampleRecord['CohortName'] = 'Global' #default cohort name 
            existingCohortID = CohortIDExists(sampleRecord['CohortName'])
            try:
                addDatasetandCohortInformation(**sampleRecord,cohortID=existingCohortID,updateDate=today,userName=current_user.username,userID=current_user.id,accessLevel=current_user.accessLevel.value)
            except:
                success = 0
                break
    if success  == 1:
        #commit transaction here.
        try:
            db.session.commit()
            return json.dumps({"Status":"Success"},default=str)
        except:
            db.session.rollback()
    else:
        db.session.rollback()
    return json.dumps({"Status": "Error"},default=str)

@app.route('/updateSampleStatus',methods=["POST"])
@login_required
def updateSampleStatus():

    sampleObj = {}
    today = dt.datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d %H:%M:%S")
    retStr= {'Status': 'Error'}
    if request.method == 'POST':
        sampleObj = request.get_json()
    else:
        return json.dumps(sampleObj,default=str)

    if 'samples' in sampleObj:
        for sampleRecord in sampleObj['samples']:
            if checkSampleUpdateRecordValues(sampleRecord) == False:
                return json.dumps({'Status': 'Error'},default=str)
   
    success = 1
    if 'samples' in sampleObj:
        for sampleRecord in sampleObj['samples']:      
           
            try:
                updateSampleStatusinDB(**sampleRecord,updateDate=today,userID=current_user.id)
            except:
                success = 0
                break       

    if success  == 1:
        #commit transaction here.
        try:
            db.session.commit()
            return json.dumps({"Status":"Success"},default=str)
        except:
            db.session.rollback()
    else:
        db.session.rollback()
    return json.dumps({"Status": "Error"},default=str)

@app.route('/updateAssignedUser',methods=["POST"])
@login_required
def updateAssignedUser():
    
    sampleObj = {}
    retStr= {'Status': 'Error'}
    if request.method == 'POST':
        sampleObj = request.get_json()
    else:
        return json.dumps(retStr,default=str)

    if current_user.accessLevel.value != 'Admin':
        return json.dumps(retStr,default=str)

    success = 1
    if 'datasets' in sampleObj and 'updateTo' in sampleObj:
        for record in sampleObj['datasets']:      
           
            try:
                if 'analysisID' in record:
                    db.session.query(Analysis).filter(Analysis.AnalysisID==record['analysisID']).update({'AssignedTo': sampleObj['updateTo']})
            except:
                success = 0
                break       
    if success  == 1:
        #commit transaction here.
        try:
            db.session.commit()
            return json.dumps({"Status":"Success"},default=str)
        except:
            db.session.rollback()
    else:
        db.session.rollback()
    return json.dumps({"Status": "Error"},default=str)

@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    form = LoginForm() 
    return render_template('Login.html',title="Login",error=e.description,form=form) 

@app.route('/logout')
@login_required
def logout():
 
    logout_user()
    return redirect(url_for('login'))
