import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter } from 'react-bootstrap-table2-filter';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import SampleLink from './SampleLink';
import ActionModal from './ActionModal';
import AnalysisPopOver from './AnalysisPopOver';
import {Grid, Row, Col,Form, Button, FormGroup,FormControl,ControlLabel} from 'react-bootstrap';
import {REQUEST_REANALYSIS, GET_LOGGED_USER} from './Url.jsx';


const { ExportCSVButton } = CSVExport;
const actionSelectOptions = { "add2Cohort": "Add to a Cohort", "updateAnalysisStatus": "Update Analysis status","updateSolvedStatus": "Update Solved status", "requestReanalysis": "Request reanalysis", "assignTo": "Assign to user"};
			      
const columns = [
                    { text: 'SampleID', dataField: 'SampleID', hidden: true }, { text: 'DatasetID', dataField: 'datasetID', hidden: true }, { text: 'FamilyID', dataField: 'FamilyID', sort: true, filter: textFilter() }, { text: 'Sample', dataField: 'Sample', sort: true, filter: textFilter(), formatter: (cell, row) => {return ( <SampleLink sampledetails={row} /> ); } }, { text: 'Dataset type', dataField: 'datasetType', sort: true, filter: textFilter() }, { text: 'Date uploaded', dataField: 'UploadDate', sort: true, filter:  textFilter(), }, { text: 'Analysis status', dataField: 'AnalysisStatus', sort: true, filter: textFilter(), formatter: (cell,row) => {return (<AnalysisPopOver sampledetails={row} />);} }, { text: 'Analysis status updated on ', dataField: 'AnalysisDate', sort:true, filter: textFilter() }, { text: 'Solved status', dataField: 'Status', sort: true, filter: textFilter() }, { text: 'Assigned to', dataField: 'AssignedTo', sort: true, filter: textFilter() }
                ];

const customTotal = (from, to, size) => (
  	
		<span className="react-bootstrap-table-pagination-total">
    			Showing { from } to { to } of { size } Results
  		</span>
);

export default class SampleTable extends React.Component {

	constructor(props){

		super(props);
		this.state = {

				selectedSamples: [],
				selected: [],
				showActionSelect: false,
				showActionModal: false,
				actionSelectValue: '',
                userAccessLevel:''
		};
		this.addtoSelected = this.addtoSelected.bind(this);
		this.addAlltoSelected = this.addAlltoSelected.bind(this);
		this.handleActionSelect = this.handleActionSelect.bind(this);
		this.resetSampleTableState= this.resetSampleTableState.bind(this);
	}
    componentDidMount(){
    
        fetch(GET_LOGGED_USER).then(resp => resp.json()).then((data) => this.setState({ userAccessLevel: data.accessLevel}));
            
    }
	resetSampleTableState(){

		this.setState({

			selectedSamples: [],
			selected: [],
			showActionSelect: false,
			showActionModal: false,
			actionSelectValue: ''
		});

	}
	componentDidUpdate(prevProps,prevState){

		if(prevProps.selectedTime!=this.props.selectedTime){

			this.setState({

				selectedSamples: [],
				selected: []

			});

		}
		if(prevState.selectedSamples.length != 0 && this.state.selectedSamples.length == 0){

			this.setState({

				showActionSelect: false

			});

		}
		
	}
	addtoSelected(row,isSelect){

        //console.log(this.state);
		if(isSelect){

			this.setState({
				
					selectedSamples: [...this.state.selectedSamples,{"SampleID":row.SampleID, "FamilyID":row.FamilyID, "datasetType":row.datasetType, "datasetID":row.datasetID, "analysisStatus":row.AnalysisStatus, "analysisID": row.AnalysisID}],
					selected: this.state.selected.includes(row.datasetID) ? this.state.selected : [...this.state.selected, row.datasetID],
					showActionSelect: true
			});
		}
		else{

			this.setState({

					selectedSamples: this.state.selectedSamples.filter(dataObj => dataObj.datasetID!=row.datasetID),
					selected: this.state.selected.filter(datasetID => datasetID != row.datasetID)
			});

		}

	}
	addAlltoSelected(isSelect, rows){

		//console.log(this.state);
		if(isSelect){

			this.setState({ 

				selectedSamples: rows.map(row => { return {"SampleID":row.SampleID, "FamilyID":row.FamilyID, "datasetType":row.datasetType, "datasetID": row.datasetID, "analysisStatus":row.AnalysisStatus, "analysisID": row.AnalysisID}}),		
				selected: rows.map(row => row.datasetID),
				showActionSelect: true
			});
		}
		else{

			 this.setState({
	
				selectedSamples: [],
				selected: [],
				showActionSelect: false
			});
		}
	
	}
	handleActionSelect(event){

        if (event.target.value == 'requestReanalysis'){

            let inProgressSamples = this.state.selectedSamples.filter((sample) => sample.analysisStatus.toLowerCase()!='done' && sample.analysisStatus.toLowerCase()!='error').map((sample) => sample.SampleID);
            if(inProgressSamples.length >0){

                alert('Samples '+inProgressSamples.join(", ")+' are still being anlayzed. You cannot request re-analysis for samples that are still in analysis. Please unselect them.');
                return 0;

            }
        }
    	this.setState({
    
	        showActionModal: event.target.value.length >0 ? true : false,
		    actionSelectValue: event.target.value

		});
    }
	render(){

		const selectRow = {

                mode: 'checkbox',
                clickToSelect: false,
				onSelect: this.addtoSelected,
				selected: this.state.selected,
				onSelectAll: this.addAlltoSelected
		};

		let maxSize = 50;
		if(this.props.samples.length){

			maxSize = this.props.samples.length;

		}
		let customPagination = paginationFactory({

			showTotal: true,
			firstPageText: 'First',
  			prePageText: 'Previous',
 			nextPageText: 'Next',
  			lastPageText: 'Last',
			paginationTotalRenderer: customTotal,
			sizePerPageList: [  { text: '10', value: 10 }, { text: '20', value: 20 }, { text: '50', value: 50}, { text: 'All', value: maxSize }],
			});
		return (

			<div>
			{ this.state.showActionSelect && 
			<Form horizontal>
			<Col md={2}>
				<FormGroup controlId='actionSelect_bottom' bsSize="sm" >
					<ControlLabel> With selected samples</ControlLabel>
					<FormControl  bsSize="sm" componentClass="select" placeholder="select" onChange={this.handleActionSelect} value={this.state.actionSelectValue}>
						<option value=""></option>
						{Object.keys(actionSelectOptions).map(opt => {
                                                                        if(opt == 'updateAnalysisStatus' || opt == 'updateSolvedStatus' || opt == 'assignTo'){
                                                                         
                                                                            if(this.state.userAccessLevel == 'Admin'){
                                                                                return (<option key = {opt} value={opt} > {actionSelectOptions[opt]} </option> ); 
                                                                            }
                                                                        }
                                                                        else{
                                                                            
                                                                             return (<option key = {opt} value={opt} > {actionSelectOptions[opt]} </option> );
                                                                    
                                                                        }
                                                                    })}
					</FormControl>
				</FormGroup>
			</Col>
			</Form>
			}
            <ToolkitProvider  data={ this.props.samples } columns={ columns }  keyField='datasetID' exportCSV = { { onlyExportSelection: true, exportAll: false } }>
                {
                    props => (
                    <div>
                    <BootstrapTable noDataIndication={this.props.noSampleStr} { ...props.baseProps } selectRow={selectRow}  pagination={ customPagination } filter={ filterFactory() }/>
                    <ExportCSVButton { ...props.csvProps }>Export CSV</ExportCSVButton>
                    </div>
                    )
                }
            </ToolkitProvider>
			{this.state.showActionModal && <ActionModal action={this.state.actionSelectValue} actionSelectOptions={actionSelectOptions} selectedSamples = {this.state.selectedSamples} sampleTableReset = {this.resetSampleTableState} />}
			</div>
		);

	}

}
