import pandas as pd
import json

from uuid import uuid4
from flask import request, jsonify, send_file, redirect
from flask_login import login_required, current_user
from glob import glob
from app import app
from os import mkdir, getcwd
from os.path import exists, join, basename, dirname
from shutil import make_archive, rmtree

GENE_DB_VERSION = ""
GENE_LIST = []
SAMPLE_WISE_DF = pd.DataFrame()
VARIANT_WISE_DF = pd.DataFrame()

## Global functions

def has_admin_access():
	return current_user.is_authenticated and current_user.accessLevel.value == "Admin"

def load_df():
	if len(glob("./gene_reports/*sample_wise.csv")) == 0 or len(glob("./gene_reports/*variant_wise.csv")) == 0:
		return
	
	latest_sample_wise = glob("./gene_reports/*sample_wise.csv")[-1]
	latest_variant_wise = glob("./gene_reports/*variant_wise.csv")[-1]

	VARIANT_WISE_VERSION = basename(latest_variant_wise).split('.')[0]
	SAMPLE_WISE_VERSION = basename(latest_sample_wise).split('.')[0]

	if VARIANT_WISE_VERSION == SAMPLE_WISE_VERSION:
		global GENE_DB_VERSION
		GENE_DB_VERSION = VARIANT_WISE_VERSION

		global VARIANT_WISE_DF
		VARIANT_WISE_DF = pd.read_csv(latest_variant_wise).set_index('Gene')

		global SAMPLE_WISE_DF
		SAMPLE_WISE_DF = pd.read_csv(latest_sample_wise).set_index('Gene')

		global GENE_LIST
		GENE_LIST = [str(gene) for gene in VARIANT_WISE_DF.index.unique() if not pd.isnull(gene)]
	else:
		raise Exception('Latest gene database files are out of sync.')

load_df()

## Routes

@app.route('/fetch/GENE_DB_VERSION', methods=["GET"])
@login_required
def get_db_version():
	if not has_admin_access():
		return
	
	return json.dumps(GENE_DB_VERSION, default=str)

@app.route('/fetch/gene_list', methods=["GET"])
@login_required
def gene_list():
	if not has_admin_access():
		return
	
	return json.dumps(GENE_LIST)

@app.route('/download/gene_report', methods=["POST"])
@login_required
def gen_gene_report():
	def check_variant_report(report_types):
		return report_types[1]
	def check_sample_report(report_types):
		return report_types[0]
	def tar_dir(dirpath, user_dir):
		archive_to = basename(dirpath)
		archive_from = dirname(dirpath)
		make_archive(dirpath, 'tar', archive_from, archive_to)
		return "%s.tar" % dirpath
	
	if not has_admin_access():
		return

	postObj = request.get_json()
	report_types = postObj['report_types']
	gene_list = postObj['gene_list']
	combined_report = postObj['combined_report']
	username = str(current_user.username)

	## Input error handling
	if gene_list == None or len(gene_list) == 0:
		return None #no genes specified
	if not check_variant_report(report_types) and not check_sample_report(report_types):
		return None #no report type specified

	## Set up directory structure
	report_dir = join(getcwd(), "gene_reports")

	if not exists(report_dir):
		mkdir(report_dir)

	report_export_dir = join(report_dir, "requests")

	if not exists(report_export_dir):
		mkdir(report_export_dir)

	user_dir = join(report_export_dir, username)

	if not exists(user_dir):
		mkdir(user_dir)

	gene_export_dir = join(user_dir, str(uuid4()))

	if not exists(gene_export_dir):
		mkdir(gene_export_dir)

	## Generate, tar and send off the reports to client
	if len(gene_list) != 1 and combined_report:
		SAMPLE_WISE_REPORT = join(gene_export_dir, "%s.%i.genes.sample_wise.csv" % (GENE_DB_VERSION, len(gene_list)))
		VARIANT_WISE_REPORT = join(gene_export_dir, "%s.%i.genes.variant_wise.csv" % (GENE_DB_VERSION, len(gene_list)))

		if check_variant_report(report_types):
			VARIANT_WISE_DF[VARIANT_WISE_DF.index.isin(gene_list)].to_csv(VARIANT_WISE_REPORT, header=True)
		if check_sample_report(report_types):
			SAMPLE_WISE_DF[SAMPLE_WISE_DF.index.isin(gene_list)].to_csv(SAMPLE_WISE_REPORT, header=True)
	else:
		for gene in gene_list:
			SAMPLE_WISE_GENE_REPORT = join(gene_export_dir, "%s.%s.sample_wise.csv" % (GENE_DB_VERSION, gene))
			VARIANT_WISE_GENE_REPORT = join(gene_export_dir, "%s.%s.variant_wise.csv" % (GENE_DB_VERSION, gene))

			if check_variant_report(report_types):
				VARIANT_WISE_DF.loc[gene].to_csv(VARIANT_WISE_GENE_REPORT, header=True)
			if check_sample_report(report_types):
				SAMPLE_WISE_DF.loc[gene].to_csv(SAMPLE_WISE_GENE_REPORT, header=True)
	
	tar_path = tar_dir(gene_export_dir, user_dir)
	rmtree(gene_export_dir)
	return send_file(tar_path, mimetype='application/gzip', cache_timeout=10, attachment_filename=basename(tar_path))