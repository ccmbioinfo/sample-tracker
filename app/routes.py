import datetime as dt
import json
import os
import time

from flask import send_file, render_template, redirect, url_for, request
from flask_login import login_user, logout_user, current_user, login_required
from flask_wtf.csrf import CSRFError
from werkzeug.security import generate_password_hash

from app import app
from app.loginform import LoginForm, PasswordResetForm
from app.non_route_functions import *


@app.route('/', methods=('GET', 'POST'))
@app.route('/login', methods=('GET', 'POST'))
def login():
	if current_user.is_authenticated:
		return redirect(url_for('index'))

	form = LoginForm()
	if form.validate_on_submit():
		user = User.query.filter_by(username=form.username.data).first()
		if user is None or not user.check_password(form.password.data):
			return render_template('Login.html', title="Login", error="Incorrect Username/Password combination",
								   form=form)
		login_user(user)
		return redirect(url_for('index'))

	return render_template('Login.html', title="Login", error=0, form=form)


@app.route('/resetpassword', methods=('GET', 'POST'))
def resetpassword():
	errorStr = 0
	successStr = 0
	prForm = PasswordResetForm()
	if prForm.validate_on_submit():
		user_obj = User.query.filter_by(username=prForm.username.data)
		user = user_obj.first()
		if user is None or not user.check_password(prForm.oldpassword.data):
			errorStr = "Incorrect Username/old password."
		else:
			if prForm.newpassword.data != prForm.confirmpassword.data:
				errorStr = "New passwords dont match!"
			elif prForm.newpassword.data == prForm.oldpassword.data:
				errorStr = "Old password and new passwords are the same!"
			else:
				try:
					user_obj.update({'password': generate_password_hash(prForm.newpassword.data)})
					db.session.commit()
					successStr = "Password updated successfully!"
				except:
					db.session.rollback()
					errorStr = "Cannot update password! Contact administrator."
	return render_template('PasswordReset.html', title="PasswordReset", error=errorStr, success=successStr, form=prForm)


@app.route("/get_logged_user")
@login_required
def get_logged_user():
	user_obj = {}
	if current_user.is_authenticated:
		user_obj['username'] = current_user.username
		user_obj['accessLevel'] = current_user.accessLevel.value
		return json.dumps(user_obj)


@app.route("/SampleUploader")
@app.route("/SearchBox")
@app.route("/CohortStats")
@app.route("/index")
@login_required
def index():
	return render_template("index.html", username=current_user.username)


@app.route("/GeneReports")
@app.route("/admin")
@login_required
def admin_only_route():
	if current_user.accessLevel != AccessLevel.Admin:
		return redirect(url_for('index'))
	return index()


@app.route("/files/uploadTemplate")
@login_required
def uploadTemplate():
	return send_file(os.path.dirname(app.instance_path) + "/static/files/upload.xlsx")


@app.route("/files/updateTemplate")
@login_required
def updateTemplate():
	return send_file(os.path.dirname(app.instance_path) + "/static/files/update.xlsx")


@app.route('/fetch/cohort_list')
@login_required
def get_cohorts():
	return json.dumps(fetch_cohorts(current_user.id, current_user.accessLevel.value), default=str)


@app.route('/fetch/uploadCenter_list')
@login_required
def get_uploadCenterList():
	uploaders = []
	query = db.session.query(Uploaders.UploadCenter)

	if current_user.accessLevel.value == 'Regular':
		query = query.filter(Uploaders.UploadUser == current_user.username)

	results = query.distinct().all()
	for uploader in results:
		uploaders.append(uploader.UploadCenter)

	return json.dumps(uploaders, default=str)


@app.route('/fetch/uploadUser_permissions')
@login_required
def get_uploadUserPermissions():
	return json.dumps(
		{'permissions': db.session.query(Uploaders).filter(Uploaders.UploadUser == current_user.username).count()},
		default=str)


@app.route('/fetch/DatasetType')
@login_required
def get_datasetType():
	datasets = []
	for dataset in db.session.query(Dataset.DatasetType).distinct().all():
		datasets.append(dataset.DatasetType)
	return json.dumps(datasets, default=str)


@app.route('/fetch/PipelineVersions')
@login_required
def get_pipelineVersions():
	pipelineVersions = []
	for version in db.session.query(Analysis.PipelineVersion).distinct().all():
		pipelineVersions.append(version.PipelineVersion)
	return json.dumps(pipelineVersions, default=str)


@app.route('/fetch/uploadUser_list')
@login_required
def get_uploadUserList():
	uploadUsers = []
	query = db.session.query(Uploaders.UploadUser)

	if current_user.accessLevel.value == 'Regular':
		subQuery = db.session.query(Uploaders).filter(Uploaders.UploadUser == current_user.username).subquery()
		query = query.filter(Uploaders.UploadCenter == subQuery.c.UploadCenter)

	for uploader in query.all():
		uploadUsers.append(uploader.UploadUser)

	return json.dumps(uploadUsers, default=str)


@app.route('/fetch/userList')
@login_required
def get_userList():
	users = []
	query = db.session.query(User.username)
	if current_user.accessLevel.value != 'Regular':
		for userName in query.all():
			users.append(userName[0])
	else:
		users.append(current_user.username)
	return json.dumps(users, default=str)


@app.route('/fetchFamilyInfo/<familyID>')
@login_required
def fetchFamilyInfo(familyID):
	family = {"probands": [], "parents": []}
	results = db.session.query(Family, Sample).join(Sample).filter(Family.FamilyID == familyID).all()
	for row in results:
		if row.Sample.SampleType != None:
			if row.Sample.SampleType.lower() == 'proband':
				family['probands'].append({"Sample": row.Sample.SampleName, "Gender": row.Sample.Gender})
			elif row.Sample.SampleType.lower() in ('parent', 'mother', 'father'):
				family['parents'].append({"Sample": row.Sample.SampleName, "Gender": row.Sample.Gender})

	return json.dumps(family, default=str)


@app.route('/fetchDatasets/<sampleID>')
@login_required
def fetchDatasets(sampleID):
	datasets = []
	results = db.session.query(Dataset, Uploaders).join(Uploaders).filter(Dataset.SampleID == sampleID).all()
	for row in results:
		cohorts = []
		cohortResult = db.session.query(Cohort, Dataset2Cohort).join(Dataset2Cohort).filter(
			Dataset2Cohort.DatasetID == row.Dataset.DatasetID)
		for cohort in cohortResult:
			cohorts.append(cohort.Cohort.CohortName)
		analyses = {}
		analysisResults = db.session.query(Analysis).filter(Analysis.DatasetID == row.Dataset.DatasetID).all()
		for analysisRow in analysisResults:
			analysisDetails = fetchAnalysisHistory(analysisRow.AnalysisID)
			analyses[analysisRow.AnalysisID] = json.loads(analysisDetails)

		datasets.append({"DatasetID": row.Dataset.DatasetID, "Cohorts": cohorts, "Analyses": analyses,
						 "DatasetType": row.Dataset.DatasetType, "EnteredDate": row.Dataset.EnteredDate,
						 "UploadStatus": row.Dataset.UploadStatus, "UploadCenter": row.Uploaders.UploadCenter,
						 "UploadUser": row.Uploaders.UploadUser, "InputFile": row.Dataset.InputFile,
						 "RunID": row.Dataset.RunID, "HPFPath": row.Dataset.HPFPath,
						 "SolvedStatus": row.Dataset.SolvedStatus, "Notes": row.Dataset.Notes})
	return json.dumps(datasets, default=str)


@app.route('/fetchAnalysisHistory/<analysisID>')
@login_required
def fetchAnalysisHistory(analysisID):
	analysisHistory = {'PipelineVersion': '', 'history': []}
	results = db.session.query(Analysis, AnalysisStatus, User).join(AnalysisStatus).join(User).filter(
		Analysis.AnalysisID == analysisID).order_by(AnalysisStatus.UpdateDate.desc()).all()
	for row in results:
		analysisHistory['PipelineVersion'] = row.Analysis.PipelineVersion
		analysisHistory['ResultsDirectory'] = row.Analysis.ResultsDirectory
		analysisHistory['ResultsBAM'] = row.Analysis.ResultsBAM
		analysisHistory['history'].append(
			[row.AnalysisStatus.AnalysisStep, row.AnalysisStatus.UpdateDate, row.User.username,
			 row.AnalysisStatus.Notes])

	return json.dumps(analysisHistory, default=str)


@app.route('/checkAndFetchSampleInformation/<SampleID>')
@login_required
def checkAndFetchSampleInformation(SampleID):
	results = db.session.query(Sample).filter(Sample.SampleID == SampleID).all()
	if current_user.accessLevel.value != 'Admin':
		if len(results) > 0:
			if db.session.query(Project, Projects2Users, Cohort, Dataset).join(Projects2Users, Cohort).join(
				Dataset).filter(Projects2Users.userID == current_user.id).filter(
				Dataset.SampleID == SampleID).count() == 0:
				return json.dumps({}, default=str)

	gender = ''
	sampleType = ''
	for row in results:
		if row.Gender is not None:
			gender = row.Gender.value
		if row.SampleType is not None:
			sampleType = row.SampleType
		return json.dumps({'Gender': gender, 'SampleType': sampleType}, default=str)
	return json.dumps({}, default=str)


@app.route('/checkAndFetchProjectInformation/<CohortName>')
@login_required
def checkAndFetchProjectInformation(CohortName):
	results = db.session.query(Project).join(Cohort).filter(Cohort.CohortName == CohortName).all()

	if current_user.accessLevel.value != 'Admin':
		if len(results) > 0:
			if db.session.query(Project, Projects2Users, Cohort).join(Projects2Users, Cohort).filter(
				Cohort.CohortName == CohortName).filter(Projects2Users.userID == current_user.id).count() == 0:
				return json.dumps({}, default=str)
	ProjectName = ''
	for row in results:
		return json.dumps({'ProjectName': row.ProjectName}, default=str)
	return json.dumps({}, default=str)


@app.route('/fetch/projectList')
@login_required
def fetchProjectList():
	projectList = []
	projectResults = None

	if current_user.accessLevel.value != 'Admin':
		projectResults = db.session.query(Project).join(Projects2Users).filter(
			Projects2Users.userID == current_user.id).all()
	else:
		projectResults = db.session.query(Project).all()

	if projectResults is not None:
		for result in projectResults:
			projectList.append(result.ProjectName)

	projectList.sort()
	if 'Temp' in projectList:
		projectList.remove('Temp')
		projectList.insert(0, 'Temp')
	return json.dumps(projectList, default=str)


@app.route('/checkIFSampleExists/<SampleID>')
@login_required
def checkIFSampleExists(SampleID):
	return json.dumps({'Exists': db.session.query(Sample).filter(Sample.SampleID == SampleID).count()}, default=str)


@app.route('/fetch/UploadUserSamples/<CohortName>')
@login_required
def get_upload_user_samples(CohortName):
	if CohortName not in fetch_cohorts(current_user.id, current_user.accessLevel.value).values():
		return json.dumps({'Status': 'Access Error'}, default=str)

	users = {}
	samples = []
	results = db.session.query(Family, Sample, Dataset, Cohort, Uploaders, Analysis, AnalysisStatus).join(Sample).join(
		Dataset).join(Cohort, Uploaders, Analysis).join(AnalysisStatus).filter(
		Cohort.CohortName == CohortName).order_by(Dataset.EnteredDate.desc()).all()
	addedDatasets = []

	for user in db.session.query(User).all():
		users[str(user.id)] = user.username

	for row in results:
		modifyIndex = -1
		if row.Dataset.DatasetID in addedDatasets:
			modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
		if modifyIndex == -1:
			notes_info = 'Last updated date and user info not available'
			if row.Dataset.NotesLastUpdatedBy is not None and row.Dataset.NotesLastUpdatedDate is not None:
				if str(row.Dataset.NotesLastUpdatedBy) in users:
					# notes_info = "Last updated by " + users[str(row.Dataset.NotesLastUpdatedBy)] + " on " + str(row.Dataset.NotesLastUpdatedDate)
					notes_info = "Last updated by " + users[
						str(row.Dataset.NotesLastUpdatedBy)] + " on " + dt.datetime.strptime(
						str(row.Dataset.NotesLastUpdatedDate), '%Y-%m-%d').strftime('%B %d, %Y')

			samples.append({'FamilyID': row.Family.FamilyID, \
							'RunID': row.Dataset.RunID, \
							'SampleName': row.Sample.SampleName, \
							'SampleID': row.Sample.SampleID, \
							'TissueType': row.Sample.TissueType, \
							'PhenomeCentralSampleID': row.Sample.PhenomeCentralSampleID, \
							'InputFile': row.Dataset.InputFile, \
							'id': row.Dataset.DatasetID, \
							'DatasetType': row.Dataset.DatasetType, \
							'EnteredDate': row.Dataset.EnteredDate, \
							'AffectedStatus': row.Sample.AffectedStatus.name if row.Sample.AffectedStatus else None, \
							'AnalysisID': row.AnalysisStatus.AnalysisID, \
							'AnalysisDate': row.AnalysisStatus.UpdateDate, \
							'AssignedTo': row.Analysis.AssignedTo, \
							'SolvedStatus': row.Dataset.SolvedStatus, \
							'Notes': row.Dataset.Notes, \
							'NotesInfo': notes_info, \
							'SendTo': row.Dataset.SendTo, \
							'AnalysisStatus': row.AnalysisStatus.AnalysisStep, \
							'ResultsDirectory': row.Analysis.ResultsDirectory, \
							'ResultsBAM': row.Analysis.ResultsBAM})

			addedDatasets.append(row.Dataset.DatasetID)
		else:
			if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
				samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
				samples[modifyIndex]['AssignedTo'] = row.Analysis.AssignedTo
				samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
				samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
	return json.dumps(samples, default=str)


@app.route('/fetch/search_cohort/<searchterm>/<searchvalue>')
@login_required
def get_samples_in_cohort(searchterm, searchvalue):
	samples = []
	results = []

	subQuery = db.session.query(Project).join(Projects2Users).filter(
		Projects2Users.userID == current_user.id).subquery()
	cohortbaseQuery = db.session.query(Family, Sample, Dataset, Cohort, Uploaders, Analysis, AnalysisStatus).join(
		Sample).join(Dataset).join(Cohort, Uploaders, Analysis).join(AnalysisStatus)

	if current_user.accessLevel.value == 'Regular':
		cohortbaseQuery = cohortbaseQuery.filter(Cohort.ProjectID == subQuery.c.ProjectID)

	if searchterm == 'cohortSelect':
		if searchvalue == 'ALL':
			results = cohortbaseQuery.all()
		else:
			results = cohortbaseQuery.filter(Cohort.CohortName == searchvalue).all()

	elif searchterm == 'familySelect':
		for family_id in searchvalue.split(','):
			family_id = family_id.strip()
			results.extend(cohortbaseQuery.filter(Family.FamilyID.like(family_id + "%")).all())

	elif searchterm == 'sampleSelect':
		for sample_id in searchvalue.split(','):
			sample_id = sample_id.strip()
			results.extend(cohortbaseQuery.filter(Sample.SampleName.like(sample_id + "%")).all())
		# results = cohortbaseQuery.filter(Sample.SampleName==searchvalue).all()

	elif searchterm == 'datasetTypeSelect':
		if searchvalue == 'ALL':
			results = cohortbaseQuery.all()
		else:
			results = cohortbaseQuery.filter(Dataset.DatasetType == searchvalue).all()
	elif searchterm == 'tissueTypeSelect':
		results = cohortbaseQuery.filter(Sample.TissueType == searchvalue).all()

	elif searchterm == 'assignedToSelect':
		if searchvalue == 'ALL':
			results = cohortbaseQuery.all()
		else:
			results = cohortbaseQuery.filter(Analysis.AssignedTo == searchvalue).all()

	elif searchterm == 'pipelineSelect':
		results = cohortbaseQuery.filter(Analysis.PipelineVersion == searchvalue).all()

	elif searchterm == 'uploadCenterSelect':
		if searchvalue == 'ALL':
			results = cohortbaseQuery.all()
		else:
			results = cohortbaseQuery.filter(Uploaders.UploadCenter == searchvalue).all()

	elif searchterm == 'uploadUserSelect':
		if searchvalue == 'ALL':
			results = cohortbaseQuery.all()
		else:
			results = cohortbaseQuery.filter(Uploaders.UploadUser == searchvalue).all()

	elif searchterm == 'uploadSelect':
		results = cohortbaseQuery.filter(Dataset.UploadStatus == searchvalue).all()

	elif searchterm == 'resultSelect':
		results = cohortbaseQuery.filter(Dataset.SolvedStatus == searchvalue).all()

	elif searchterm == 'analysisSelect':
		results = cohortbaseQuery.all()
	else:
		pass

	addedDatasets = []
	for row in results:
		modifyIndex = -1
		if row.Dataset.DatasetID in addedDatasets:  # if dataset is already added, get its index and check if current analysis date is higher than the previous
			modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
		if modifyIndex == -1:
			samples.append({'Sample': row.Sample.SampleName, \
							'SampleID': row.Sample.SampleID, \
							'activeCohort': row.Cohort.CohortName, \
							'datasetID': row.Dataset.DatasetID, \
							'datasetType': row.Dataset.DatasetType, \
							'EnteredDate': row.Dataset.EnteredDate, \
							'AnalysisDate': row.AnalysisStatus.UpdateDate, \
							'AnalysisID': row.AnalysisStatus.AnalysisID, \
							'Status': row.Dataset.SolvedStatus, \
							'AnalysisStatus': row.AnalysisStatus.AnalysisStep, \
							'FamilyID': row.Family.FamilyID, \
							'AssignedTo': row.Analysis.AssignedTo, \
							'Notes': row.Dataset.Notes})
			addedDatasets.append(row.Dataset.DatasetID)
		else:
			if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
				samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
				samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
				samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
	if searchterm == 'analysisSelect':
		samples = list(filter(lambda record: record['AnalysisStatus'].lower() == searchvalue.lower(), samples))
	return json.dumps(samples, default=str)


@app.route('/fetch/search_cohort_by_date/<dateType>/<startDate>/<endDate>')
@login_required
def get_samples_in_cohort_by_date(dateType, startDate, endDate):
	samples = []
	if (startDate == '0' and endDate == '0') or (startDate.isdigit() == False or endDate.isdigit() == False):
		return json.dumps(samples, default=str)

	startDate, endDate = int(startDate), int(endDate)
	if startDate != 0:
		startDate = dt.datetime.utcfromtimestamp(startDate / 1000).strftime("%Y-%m-%d")
	if endDate != 0:
		endDate = dt.datetime.utcfromtimestamp(endDate / 1000).strftime("%Y-%m-%d")
	else:
		endDate = dt.datetime.utcfromtimestamp(time.time()).strftime("%Y-%m-%d")

	subQuery = db.session.query(Project).join(Projects2Users).filter(
		Projects2Users.userID == current_user.id).subquery()
	cohortbaseQuery = db.session.query(Family, Sample, Dataset, Cohort, Uploaders, Analysis, AnalysisStatus).join(
		Sample).join(Dataset).join(Cohort, Uploaders, Analysis).join(AnalysisStatus)

	if current_user.accessLevel.value == 'Regular':
		cohortbaseQuery = cohortbaseQuery.filter(Cohort.ProjectID == subQuery.c.ProjectID)

	if dateType == 'analysisDate':
		results = cohortbaseQuery.filter(AnalysisStatus.AnalysisStep == 'done').filter(
			AnalysisStatus.UpdateDate >= startDate).filter(AnalysisStatus.UpdateDate <= endDate).all()
	elif dateType == 'enteredDate':
		results = cohortbaseQuery.filter(Dataset.UploadStatus == 'complete').filter(
			Dataset.EnteredDate >= startDate).filter(Dataset.EnteredDate <= endDate).all()
	addedDatasets = []
	for row in results:
		modifyIndex = -1
		if row.Dataset.DatasetID in addedDatasets:  # if dataset is already added, get its index and check if current analysis date is higher than the previous
			modifyIndex = addedDatasets.index(row.Dataset.DatasetID)
		if modifyIndex == -1:
			samples.append({'Sample': row.Sample.SampleName, \
							'SampleID': row.Sample.SampleID, \
							'activeCohort': row.Cohort.CohortName, \
							'datasetID': row.Dataset.DatasetID, \
							'datasetType': row.Dataset.DatasetType, \
							'EnteredDate': row.Dataset.EnteredDate, \
							'AnalysisDate': row.AnalysisStatus.UpdateDate, \
							'AnalysisID': row.AnalysisStatus.AnalysisID, \
							'Status': row.Dataset.SolvedStatus, \
							'AnalysisStatus': row.AnalysisStatus.AnalysisStep, \
							'FamilyID': row.Family.FamilyID, \
							'AssignedTo': row.Analysis.AssignedTo})
			addedDatasets.append(row.Dataset.DatasetID)
		else:
			if row.AnalysisStatus.UpdateDate > samples[modifyIndex]['AnalysisDate']:
				samples[modifyIndex]['AnalysisID'] = row.AnalysisStatus.AnalysisID
				samples[modifyIndex]['AnalysisStatus'] = row.AnalysisStatus.AnalysisStep
				samples[modifyIndex]['AnalysisDate'] = row.AnalysisStatus.UpdateDate
	return json.dumps(samples, default=str)


@app.route('/checkInputForm/<field>/<value>')
@login_required
def checkInputForm(field, value):
	if current_user.accessLevel.value == 'Admin':
		return json.dumps({'Status': 'Success'}, default=str)

	if field == 'FamilyID':
		if db.session.query(Sample).filter(Sample.FamilyID == value).count() > 0:  # if familyID exists
			if db.session.query(Project, Projects2Users, Cohort, Dataset, Sample).join(Projects2Users, Cohort).join(
				Dataset).join(Sample).filter(Projects2Users.userID == current_user.id).filter(
				Sample.FamilyID == value).count() == 0:
				return json.dumps({'Status': 'Error'}, default=str)
	elif field == 'SampleName':
		if db.session.query(Sample).filter(Sample.SampleName == value).count() > 0:  # if sampleName exists
			if db.session.query(Project, Projects2Users, Cohort, Dataset, Sample).join(Projects2Users, Cohort).join(
				Dataset).join(Sample).filter(Projects2Users.userID == current_user.id).filter(
				Sample.SampleName == value).count() == 0:
				return json.dumps({'Status': 'Error'}, default=str)
	elif field == 'ProjectName':
		if db.session.query(Project).filter(Project.ProjectName == value).count() > 0:  # if projectName exists
			if db.session.query(Project, Projects2Users).join(Projects2Users).filter(
				Project.ProjectName == value).filter(Projects2Users.userID == current_user.id).count() == 0:
				return json.dumps({'Status': 'Error'}, default=str)
	elif field == 'CohortName':
		if db.session.query(Cohort).filter(Cohort.CohortName == value).count() > 0:  # if cohortName exists
			if db.session.query(Project, Projects2Users, Cohort).join(Projects2Users, Cohort).filter(
				Projects2Users.userID == current_user.id).filter(Cohort.CohortName == value).count() == 0:
				return json.dumps({'Status': 'Error'}, default=str)
	else:
		return json.dumps({'Status': 'Success'}, default=str)

	return json.dumps({'Status': 'Success'}, default=str)


@app.route('/checkUpdateSamples', methods=["POST"])
@login_required
def checkUpdateSamples():
	postObj = {}
	retStr = {'Errors': []}
	if request.method == 'POST':
		postObj = request.get_json()
	else:
		return json.dumps({'Error': 'RequestError'}, default=str)
	if 'samples' in postObj:
		for sampleRecord in postObj['samples']:

			if 'SampleID' in sampleRecord and 'DatasetType' in sampleRecord and 'EnteredDate' in sampleRecord:

				datasetID = -1
				datasetIDQuery = db.session.query(Dataset, Analysis).join(Analysis).filter(
					Dataset.SampleID == sampleRecord['SampleID']).filter(
					Dataset.DatasetType == sampleRecord['DatasetType']).filter(
					Analysis.RequestedDate == sampleRecord['EnteredDate'])
				if datasetIDQuery.count() != 1:
					retStr['Errors'].append(
						"Cannot find dataset matching Sample: " + sampleRecord['SampleID'] + " , Type: " + sampleRecord[
							'DatasetType'] + ", EnteredDate: " + sampleRecord['EnteredDate'])
				else:

					dataset = datasetIDQuery.first()
					datasetID = dataset.Dataset.DatasetID

					if current_user.accessLevel.value != 'Admin':
						if db.session.query(Project, Projects2Users, Cohort, Dataset).join(Projects2Users, Cohort).join(
							Dataset).filter(Projects2Users.userID == current_user.id).filter(
							Dataset.DatasetID == datasetID).count() == 0:
							retStr['Errors'].append(
								"You dont have permissions to edit the dataset matching Sample: " + sampleRecord[
									'SampleID'] + " , Type: " + sampleRecord['DatasetType'] + ", EnteredDate: " +
								sampleRecord['EnteredDate'])
			else:
				retStr['Errors'].append("Sample " + SampleID + "is missing some data")
	else:
		retStr['Errors'].append('No data!')
	return json.dumps(retStr, default=str)


@app.route('/fetch/cohort_stats/<project>')
@login_required
def get_cohort_stats(project):
	cohorts = []
	tmpCohort = {}

	for cohortID, cohortName in fetch_cohorts(current_user.id, current_user.accessLevel.value, project).items():

		tmpObj = {}
		tmpObj['CohortName'] = cohortName
		tmpObj['CohortID'] = cohortID
		descQuery = db.session.query(Cohort).filter(Cohort.CohortID == cohortID).first()
		tmpObj['CohortDescription'] = descQuery.CohortDescription
		tmpObj['Families'] = db.session.query(Family).join(Sample).join(Dataset).join(Cohort).filter(
			Cohort.CohortName == cohortName).distinct().count()
		tmpObj['Samples'] = db.session.query(Dataset.SampleID).join(Cohort).filter(
			Cohort.CohortName == cohortName).distinct().count()
		tmpObj['pendingSamples'] = []
		pendingResults = db.session.query(Dataset, Analysis).join(Analysis).filter(
			Dataset.ActiveCohort == cohortID).filter(Analysis.ResultsBAM == None).all()
		for result in pendingResults:
			if result.Dataset.SampleID not in tmpObj['pendingSamples']:
				tmpObj['pendingSamples'].append(result.Dataset.SampleID)

		tmpObj['Processed'] = int(tmpObj['Samples']) - len(tmpObj['pendingSamples'])
		if cohortName == 'Temp':
			tmpCohort = tmpObj
		else:
			cohorts.append(tmpObj)

	cohorts.sort(key=lambda c: c['CohortName'])
	if 'CohortName' in tmpCohort:
		cohorts.insert(0, tmpCohort)

	return json.dumps(cohorts, default=str)


@app.route('/requestReanalysis', methods=["POST"])
@login_required
def requestReanalysis():
	postObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		postObj = request.get_json()
	else:
		return json.dumps(retStr, default=str)

	today_date = dt.datetime.now().strftime('%Y-%m-%d')
	today = dt.datetime.now().strftime('%Y-%m-%d  %H:%M:%S')
	updateSuccess = 1
	if 'Samples' in postObj:
		for dataset in postObj['Samples']:
			analysisID = -1
			if 'datasetID' in dataset:
				try:
					newAnalysis = Analysis(DatasetID=dataset['datasetID'], RequestedDate=today_date)
					Notes = None
					if 'reAnalysisNotes' in dataset:
						Notes = dataset['reAnalysisNotes']
					newAnalysisStatus = AnalysisStatus(AnalysisStep='Reanalysis requested', UpdateDate=today,
													   UpdateUser=current_user.id, Notes=Notes)
					newAnalysis.analysisStatuses.append(newAnalysisStatus)
					db.session.add(newAnalysis)
				except:
					updateSuccess = 0
			else:
				updateSuccess = 0
	else:
		updateSuccess = 0

	if updateSuccess == 1:
		# commit transaction here.
		try:
			db.session.commit()
			return json.dumps({"Status": "Success"}, default=str)
		except:
			db.session.rollback()
	else:
		db.session.rollback()

	return json.dumps(retStr, default=str)


@app.route('/updateAnalysisStatus', methods=["POST"])
@login_required
def updateAnalysisStatus():
	postObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		postObj = request.get_json()

	else:
		return json.dumps(retStr, default=str)

	# check for postObj updateTo values in allowed set
	today = dt.datetime.now().strftime('%Y-%m-%d  %H:%M:%S')
	updateSuccess = 1
	newStatusRows = []
	if 'datasets' in postObj and 'updateTo' in postObj:

		for dataSet in postObj['datasets']:
			if 'analysisID' in dataSet:
				checkStatusQuery = AnalysisStatus.query.filter(
					AnalysisStatus.AnalysisID == dataSet['analysisID']).filter(
					AnalysisStatus.AnalysisStep == postObj['updateTo'])
				if checkStatusQuery.count() == 1:
					try:
						checkStatusQuery.update({'UpdateDate': today, 'UpdateUser': current_user.id})
					except:
						updateSuccess = 0
						break
				else:
					newStatusRows.append(
						AnalysisStatus(AnalysisID=dataSet['analysisID'], AnalysisStep=postObj['updateTo'],
									   UpdateDate=today, UpdateUser=current_user.id))

	if updateSuccess == 1:

		db.session.bulk_save_objects(newStatusRows)
		try:
			db.session.commit()
			retStr['Status'] = 'Updated!'
		except:
			db.session.rollback()
			retStr['Status'] = 'Failure'
	else:
		db.session.rollback()
		retStr['Status'] = 'Failure'

	return json.dumps(retStr, default=str)


@app.route('/updateDatasetFields', methods=["POST"])
@login_required
def updateDatasetFields():
	postObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		postObj = request.get_json()

	else:
		return json.dumps(retStr, default=str)

	# check for postObj updateTo values in allowed set
	updateSuccess = 1
	if 'datasets' in postObj and 'updateTo' in postObj and 'field' in postObj:

		for dataSet in postObj['datasets']:
			if 'datasetID' in dataSet:
				if postObj['field'] == 'DatasetType':
					sample_id = Dataset.query.filter_by(DatasetID=dataSet['datasetID']).first().SampleID
					if check_if_dataset_exists(sample_id, postObj['updateTo']):
						retStr = {
							'Status': 'Error! This dataset already exists for this sample. Dataset type is not updated in database. Please refresh the browser to see the original value.'}
						updateSuccess = 0
						break
				try:
					db.session.query(Dataset).filter(Dataset.DatasetID == dataSet['datasetID']).update(
						{postObj['field']: postObj['updateTo']})
					if postObj['field'] == 'Notes':
						db.session.query(Dataset).filter(Dataset.DatasetID == dataSet['datasetID']).update(
							{'NotesLastUpdatedBy': current_user.id,
							 'NotesLastUpdatedDate': dt.datetime.now().strftime('%Y-%m-%d')})
				except:
					updateSuccess = 0
					break

	if updateSuccess == 1:
		try:
			db.session.commit()
			retStr['Status'] = 'Updated!'
		except:
			db.session.rollback()
	else:
		db.session.rollback()

	return json.dumps(retStr, default=str)


@app.route('/addDatasets2Cohort', methods=["POST"])
@login_required
def addDatasets2Cohort():
	postObj = {}
	retStr = {'Status': 'Error moving samples to a different cohort. Please contact administrator!'}
	if request.method == 'POST':
		postObj = request.get_json()
	else:
		return json.dumps(retStr, default=str)

	newOrUpdate = 'new'
	cohortID = -1

	if 'add2ExistingCohort' in postObj and len(postObj['add2ExistingCohort']) > 0:
		newOrUpdate = 'existing'
		cohortID = postObj['add2ExistingCohort']

	else:
		if 'add2NewCohort' in postObj and len(postObj['add2NewCohort']) >= 5:
			if postObj['add2NewCohort'] in fetch_cohorts(current_user.id, current_user.accessLevel.value).values():
				return json.dumps({"Status": "Cohort name already exists. Please enter a new name"}, default=str)
			CohortNameTakenbyOtherLab = json.loads(checkInputForm('CohortName', postObj['add2NewCohort']))
			if CohortNameTakenbyOtherLab['Status'] != 'Success':
				return json.dumps({"Status": "You dont have access to this Cohort. Please enter a new name."},
								  default="str")
		else:
			return json.dumps({"Status": "Cohort name needs to be atleast 5 characters."}, default="str")

	if newOrUpdate == 'new':
		try:
			NewCohort = Cohort(CohortName=postObj['add2NewCohort'])
			db.session.add(NewCohort)
			db.session.commit()
		except:
			db.session.rollback()
			return json.dumps(retStr, default=str)
		cohortID = NewCohort.CohortID

	if cohortID == -1:
		return json.dumps(retStr, default=str)

	updateSuccess = 1
	if 'datasets' in postObj:
		for dataset in postObj['datasets']:
			if 'datasetID' in dataset:
				checkDatasetCohortQuery = Dataset2Cohort.query.filter(
					Dataset2Cohort.DatasetID == dataset['datasetID']).filter(Dataset2Cohort.CohortID == cohortID)
				try:
					if checkDatasetCohortQuery.count() == 0:
						db.session.add(Dataset2Cohort(DatasetID=dataset['datasetID'], CohortID=cohortID))
					db.session.query(Dataset).filter(Dataset.DatasetID == dataset['datasetID']).update(
						{'ActiveCohort': cohortID})
				except:
					updateSuccess = 0
					break

		if updateSuccess == 1:
			try:
				db.session.commit()
				return json.dumps({"Status": "Successfully moved selected samples to cohort."}, default=str)
			except:
				db.session.rollback()
		else:
			db.session.rollback()

	return json.dumps(retStr, default=str)


@app.route('/insertNewSamplesintoDatabase', methods=["POST"])
@login_required
def insertNewSamplesintoDatabase():
	sampleObj = {}
	today = dt.datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d %H:%M:%S")
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		sampleObj = request.get_json()
	else:
		return json.dumps(sampleObj, default=str)

	if 'samples' in sampleObj:
		for index, sampleRecord in enumerate(sampleObj['samples']):

			for field in sampleObj['samples'][index]:
				sampleObj['samples'][index][field] = str(sampleObj['samples'][index][field]).rstrip()
			if checkSampleRecordValues(sampleRecord) == False:
				return json.dumps({'Status': 'Error', 'Reason': 'Some of the samples are missing required columns.'},
								  default=str)
			if check_if_dataset_exists(sampleRecord['SampleID'], sampleRecord['DatasetType']):
				return json.dumps({'Status': 'Error', 'Reason': "Error in line " + str(
					index + 1) + '. This dataset already exists for this sample. Please remove it or change the dataset type.'},
								  default=str)
			if len(checkCohortandProjectAccess(current_user.id, current_user.accessLevel.value, sampleRecord)) > 0:
				return json.dumps({'Status': 'Error', 'Reason': "Error in line " + str(index + 1) + ". " + retStatus},
								  default=str)
			if 'CohortName' not in sampleRecord or len(sampleRecord['CohortName']) == 0:
				# get default cohort for project here.
				sampleObj['samples'][index]['CohortName'] = get_default_cohort(sampleRecord['ProjectName'])
				if sampleObj['samples'][index]['CohortName'] is None:
					return json.dumps({'Status': 'Error',
									   'Reason': "Error in line " + str(index + 1) + ". Project " + sampleRecord[
										   'ProjectName'] + " doesn't have a default cohort. Please enter a cohort name for this sample."},
									  default=str)
			else:
				# remove trailing spaces here
				sampleObj['samples'][index]['CohortName'] = sampleObj['samples'][index]['CohortName'].rstrip()

			if 'Gender' not in sampleRecord or len(sampleRecord['Gender']) == 0:
				sampleObj['samples'][index]['Gender'] = None

	success = 1
	if 'samples' in sampleObj:
		for sampleRecord in sampleObj['samples']:

			if famIDExists(sampleRecord['FamilyID']) == 0:
				# insert familyID into database here.
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
			existingCohortID = CohortIDExists(sampleRecord['CohortName'])
			try:
				addDatasetandCohortInformation(**sampleRecord, cohortID=existingCohortID, updateDate=today,
											   userName=current_user.username, userID=current_user.id,
											   accessLevel=current_user.accessLevel.value)
			except:
				success = 0
				break
	if success == 1:
		try:
			db.session.commit()
			return json.dumps({"Status": "Success"}, default=str)
		except:
			db.session.rollback()
	return json.dumps({"Status": "Error", 'Reason': 'Database commit error!  Please contact Teja!'}, default=str)


@app.route('/updateSampleStatus', methods=["POST"])
@login_required
def updateSampleStatus():
	sampleObj = {}
	today = dt.datetime.fromtimestamp(time.time()).strftime("%Y-%m-%d %H:%M:%S")
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		sampleObj = request.get_json()
	else:
		return json.dumps(sampleObj, default=str)

	if 'samples' in sampleObj:
		for sampleRecord in sampleObj['samples']:
			if checkSampleUpdateRecordValues(sampleRecord) == False:
				return json.dumps({'Status': 'Error'}, default=str)

	success = 1
	if 'samples' in sampleObj:
		for sampleRecord in sampleObj['samples']:
			try:
				updateSampleStatusinDB(**sampleRecord, updateDate=today, userID=current_user.id)
			except:
				success = 0
				break

	if success == 1:
		# commit transaction here.
		try:
			db.session.commit()
			return json.dumps({"Status": "Success"}, default=str)
		except:
			db.session.rollback()
	else:
		db.session.rollback()
	return json.dumps({"Status": "Error"}, default=str)


@app.route('/updateAnalysisFields', methods=["POST"])
@login_required
def updateAnalysisFields():
	sampleObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		sampleObj = request.get_json()
	else:
		return json.dumps(retStr, default=str)

	success = 1
	if 'datasets' in sampleObj and 'updateTo' in sampleObj and 'field' in sampleObj:
		for record in sampleObj['datasets']:

			try:
				if 'analysisID' in record:
					db.session.query(Analysis).filter(Analysis.AnalysisID == record['analysisID']).update(
						{sampleObj['field']: sampleObj['updateTo']})
			except:
				success = 0
				break
	if success == 1:
		# commit transaction here.
		try:
			db.session.commit()
			return json.dumps({"Status": "updated!"}, default=str)
		except:
			db.session.rollback()
	else:
		db.session.rollback()
	return json.dumps({"Status": "Error"}, default=str)


@app.route('/updateSampleFields', methods=["POST"])
@login_required
def updateSampleFields():
	sampleObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		sampleObj = request.get_json()
	else:
		return json.dumps(retStr, default=str)

	success = 1
	if 'samples' in sampleObj and 'updateTo' in sampleObj and 'field' in sampleObj:
		for record in sampleObj['samples']:

			if 'sampleID' in record:

				if sampleObj['field'] == 'SampleID':
					if SampleIDExists(sampleObj['updateTo']) == 1:
						return json.dumps({'Status': 'New SampleID exists in database. SampleID is not updated.'},
										  default=str)

					oldFamID, oldSampleName = record['sampleID'].split("_", 1)
					newFamID, newSampleName = sampleObj['updateTo'].split("_", 1)
					if newFamID is None or newSampleName is None:
						return json.dumps(retStr, default=str)

					# if new familyID doesnt exist - create it first.
					if famIDExists(newFamID) == 0:
						try:
							insertFamID(newFamID)
						except:
							success = 0
							break
					# then update sample's family ID
					try:
						db.session.query(Sample).filter(Sample.SampleID == record['sampleID']).update(
							{'FamilyID': newFamID})
					except:
						success = 0
						break
					# then update sample's sample Name
					if db.session.query(Sample).filter(Sample.SampleID == record['sampleID']).filter(
						Sample.SampleName == newSampleName).count() == 0:
						try:
							db.session.query(Sample).filter(Sample.SampleID == record['sampleID']).update(
								{'SampleName': newSampleName})
						except:
							success = 0
							break
						# update sample table regradless of the fields!
				try:
					db.session.query(Sample).filter(Sample.SampleID == record['sampleID']).update(
						{sampleObj['field']: sampleObj['updateTo']})
				except:
					success = 0
					break
	if success == 1:
		# commit transaction here.
		try:
			db.session.commit()
			return json.dumps({"Status": "updated!"}, default=str)
		except:
			db.session.rollback()
	else:
		db.session.rollback()
	return json.dumps({"Status": "Error"}, default=str)


@app.route('/updateCohortFields', methods=["POST"])
@login_required
def updateCohortFields():
	cohortObj = {}
	retStr = {'Status': 'Error'}
	if request.method == 'POST':
		cohortObj = request.get_json()
	else:
		return json.dumps(retStr, default=str)

	success = 1
	if 'CohortID' in cohortObj and 'updateTo' in cohortObj and 'field' in cohortObj:

		if cohortObj['field'] == 'CohortName':
			if db.session.query(Cohort).filter(Cohort.CohortName == cohortObj['updateTo']).count() == 1:
				return json.dumps({
									  "Status": "Error! This cohort name already exists. If you are wishing to move samples to a different cohort, please do so from the 'Search Samples' tab."},
								  default=str)
		try:
			db.session.query(Cohort).filter(Cohort.CohortID == cohortObj['CohortID']).update(
				{cohortObj['field']: cohortObj['updateTo']})
		except:
			success = 0
	if success == 1:
		# commit transaction here.
		try:
			db.session.commit()
			return json.dumps({"Status": "updated!"}, default=str)
		except:
			db.session.rollback()
	else:
		db.session.rollback()
	return json.dumps({"Status": "Error"}, default=str)


@app.errorhandler(CSRFError)
def handle_csrf_error(e):
	form = LoginForm()
	return render_template('Login.html', title="Login", error=e.description, form=form)


@app.route('/logout')
@login_required
def logout():
	logout_user()
	return redirect(url_for('login'))
