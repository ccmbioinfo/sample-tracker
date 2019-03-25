import React from "react";
import {Grid, Row, Col,Form, Button, FormGroup,FormControl,ControlLabel} from 'react-bootstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter, selectFilter } from 'react-bootstrap-table2-filter';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import cellEditFactory, {Type}  from 'react-bootstrap-table2-editor';
import ActionModal from './ActionModal';
import {DATASET_TYPES, ANALYSIS_STATUSES, SOLVED_STATUSES} from './Constants';
import {FETCH_UPLOAD_USER_SAMPLES, CHECK_IF_SAMPLE_EXISTS,UPDATE_SAMPLE_FIELDS, UPDATE_DATASET_FIELDS,UPDATE_ANALYSIS_STATUS,FETCH_USER_LIST, UPDATE_ANALYSIS_FIELDS} from './Url.jsx';


const analysis_status_for_edits = [];
const analysis_status_for_filters = {};
ANALYSIS_STATUSES.forEach((analysisStatus) => {analysis_status_for_filters[analysisStatus] = analysisStatus; analysis_status_for_edits.push({value: analysisStatus,label: analysisStatus})});

const solved_status_for_edits = [];
const solved_status_for_filters = {};
SOLVED_STATUSES.forEach((solvedStatus) => { solved_status_for_filters[solvedStatus]=solvedStatus; solved_status_for_edits.push({value: solvedStatus,label: solvedStatus})});

const datasets_for_edits = [];
const datasets_for_filters = {};
DATASET_TYPES.forEach((solvedStatus) => { datasets_for_filters[solvedStatus]=solvedStatus; datasets_for_edits.push({value: solvedStatus,label: solvedStatus})});

const divStyle = {width: "2550px",fontSize : "0.85em"};
const customTotal = (from, to, size) => (

            <span className="react-bootstrap-table-pagination-total">
                Showing { from } to { to } of { size } 
            </span>
);

const options = { paginationTotalRenderer: customTotal, sizePerPageList: [ { text: '50', value: 50 }, { text: '100', value: 100 }, { text: '500', value: 500}], showTotal: true };
const actionSelectOptions = { "add2Cohort": "Move to a different Cohort", "updateAnalysisStatus": "Update Analysis status","updateSolvedStatus": "Update Solved status", "requestReanalysis": "Request reanalysis", "assignTo": "Assign to user"};

export default class CohortTable extends React.Component{

    constructor(props) {
        super(props);
        this.state={
                    selectedSamples: [],
                    selected: [],
                    showActionSelect: false,
                    showActionModal: false,
                    actionSelectValue: '',
                    "userList": []
        }; 
        fetch(FETCH_USER_LIST)
        .then(resp => resp.json())
        .then(data => { 
                        let users = [{'value': '', label: ''}];
                        data.forEach((userName) => {users.push({'value':userName,label:userName})});
                        this.setState({"userList": users});
        });
        this.addtoSelected = this.addtoSelected.bind(this);
        this.addAlltoSelected = this.addAlltoSelected.bind(this);
        this.handleActionSelect = this.handleActionSelect.bind(this);
        this.resetSampleTableState = this.resetSampleTableState.bind(this);
    }
    componentDidUpdate(prevProps,prevState){

        if(prevState.selectedSamples.length != 0 && this.state.selectedSamples.length == 0){

            this.setState({

                showActionSelect: false

            });

        }

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
    addtoSelected(row,isSelect){

        console.log(this.state);
        if(isSelect){

            this.setState({
                
                    selectedSamples: [...this.state.selectedSamples,{"SampleID": row.SampleID, "datasetID":row.id, "analysisStatus":row.AnalysisStatus, "analysisID": row.AnalysisID}],
                    selected: this.state.selected.includes(row.id) ? this.state.selected : [...this.state.selected, row.id],
                    showActionSelect: true
            });
        }
        else{

            this.setState({

                    selectedSamples: this.state.selectedSamples.filter(dataObj => dataObj.datasetID!=row.id),
                    selected: this.state.selected.filter(datasetID => datasetID != row.id)
            });

        }

    }
    addAlltoSelected(isSelect, rows){

        console.log(this.state);
        if(isSelect){

            this.setState({ 

                selectedSamples: rows.map(row => { return {"SampleID":row.SampleID,"datasetID": row.id, "analysisStatus":row.AnalysisStatus, "analysisID": row.AnalysisID}}),       
                selected: rows.map(row => row.id),
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
    render() {
   
        const selectRow = {
                mode: 'checkbox',
                clickToSelect: true,
                clickToEdit: true, 
                bgColor: '#00BFFF',
                onSelect: this.addtoSelected,
                selected: this.state.selected,
                onSelectAll: this.addAlltoSelected
        };
        let  columns = [
                    {dataField: 'SampleID', text:'Sample ID',sort: true, editable: true,editor: {type: Type.TEXT}, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, 
                        validator: (newValue,row,column,done) => {
                                    if(newValue.indexOf("_") <=1){
        
                                        return {

                                            valid: false,
                                            message: 'SampleID should be in the format FamilyID_SampleName'
                                                
                                        };

                                    }
                        },
    

                    },
                    {dataField: 'PhenomeCentralSampleID', text: 'PCID', sort: true,editable: true,editor: {type: Type.TEXT}, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'AssignedTo', text:'Assigned to',sort: true, editable: true, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: this.state.userList}},
                    {dataField: 'DatasetType', text:"Dataset",sort: true, editable: true,editor: {type: Type.SELECT, options:  datasets_for_edits}, filter: selectFilter({ options: datasets_for_filters }), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'TissueType', text:"Tissue",sort: true, editable: true, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; },editor: {type: Type.TEXT}},
                    {dataField: 'UploadDate', text: 'Upload Date', sort:true, editable: true, editor: {type: Type.TEXT}, headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'SolvedStatus',text: 'Solved?', sort: true, filter: selectFilter({ options: solved_status_for_filters }),headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: solved_status_for_edits}},
                    {dataField: 'AnalysisStatus', text: 'Analysis Status',sort: true, filter: selectFilter({ options: analysis_status_for_filters }), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: analysis_status_for_edits} },
                    {dataField: 'Notes', text: 'Notes',sort: true,editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }, editor: {type: Type.TEXT}},
                    {dataField: 'InputFile',text: 'Input file', sort: true, editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; },editor: {type: Type.TEXT}},
                    {dataField: 'ResultsBAM', text: 'Result BAM',sort: true,editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }, editor: {type: Type.TEXT}},
        ];
    return  (

        <div style = {divStyle}>
        { this.state.showActionSelect &&
            <Form horizontal>
            <Col md={1}>
                <FormGroup controlId='actionSelect_bottom' bsSize="sm" >
                    <ControlLabel> With selected samples</ControlLabel>
                    <FormControl  bsSize="sm" componentClass="select" placeholder="select" onChange={this.handleActionSelect} value={this.state.actionSelectValue}>
                        <option value=""></option>
                        {Object.keys(actionSelectOptions).map(opt => { return (<option key = {opt} value={opt} > {actionSelectOptions[opt]} </option> ); } )}
                    </FormControl>
                </FormGroup>
            </Col>
            </Form>
            }
        <ToolkitProvider  data={this.props.samples} columns={ columns }  keyField='id'> 
                {
                    props => (
                    <div>
                    <BootstrapTable 
                    noDataIndication="..." { ...props.baseProps }  
                    pagination={  paginationFactory(options) } 
                    filter={ filterFactory() } 
                    selectRow={selectRow}
                    cellEdit={  cellEditFactory({ 
                                                mode: 'dbclick',
                                                blurToSave: true,
                                                afterSaveCell: (oldValue, newValue, row, column) => {
                                                                                            if(newValue != oldValue && newValue.length >0){

                                                                                                let UPDATE_URL = '';    
                                                                                                let updateObj = { 'updateTo':newValue };
                                                                                                if(column.dataField == 'AnalysisStatus'){
                                                                                                    
                                                                                                    updateObj['datasets'] = [{'analysisID': row.AnalysisID}];
                                                                                                    UPDATE_URL = UPDATE_ANALYSIS_STATUS;
                                                                                                }
                                                                                                else if (column.dataField == 'UploadDate' || column.dataField == 'SolvedStatus' || column.dataField == 'InputFile' || column.dataField == 'Notes' || column.dataField == 'DatasetType'){
                                                                                                        
                                                                                                        updateObj['field'] = column.dataField;       
                                                                                                        updateObj['datasets'] = [{'datasetID': row.id}];
                                                                                                        UPDATE_URL = UPDATE_DATASET_FIELDS;    
                                                                                                 }
                                                                                                 else if(column.dataField == 'AssignedTo' || column.dataField == 'ResultsBAM'){
                                                                                                
                                                                                                        updateObj['datasets'] = [{'analysisID': row.AnalysisID }];  
                                                                                                        updateObj['field'] = column.dataField;          
                                                                                                        UPDATE_URL = UPDATE_ANALYSIS_FIELDS; 
                                                                                                 }
                                                                                                 else if(column.dataField == 'PhenomeCentralSampleID' || column.dataField == "TissueType"){

                                                                                                    updateObj['samples'] = [{'sampleID': row.SampleID}];
                                                                                                    updateObj['field'] = column.dataField;
                                                                                                    UPDATE_URL = UPDATE_SAMPLE_FIELDS;
                                                                                                }
                                                                                                else if(column.dataField == 'SampleID'){

                                                                                                    updateObj['samples'] = [{'sampleID': oldValue}];
                                                                                                    updateObj['field'] = column.dataField;
                                                                                                    UPDATE_URL = UPDATE_SAMPLE_FIELDS;

                                                                                                }
                                                                                                if(UPDATE_URL.length >0){

                                                                                                    fetch(UPDATE_URL,{
                                                                                                        method: "post",
                                                                                                        headers: {

                                                                                                            'Accept': 'application/json, text/plain, */*',
                                                                                                            'Content-Type': 'application/json',
                                                                                                            'X-CSRFToken': document.getElementById('csrf_token').value
                                                                                                        },
                                                                                                        body: JSON.stringify(updateObj)
                                                                                                    })
                                                                                                    .then(response =>response.json())
                                                                                                    .then(data => alert(data.Status));
                                                                                                }
                                                                                              }
                                                } } ) }
                    />
                    </div>
                    )
                }
            </ToolkitProvider>
            {this.state.showActionModal && <ActionModal action={this.state.actionSelectValue} actionSelectOptions={actionSelectOptions} selectedSamples = {this.state.selectedSamples} sampleTableReset = {this.resetSampleTableState} />}        
        </div>
    );
  }
}
