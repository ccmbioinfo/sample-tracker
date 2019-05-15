import React from "react";
import {Checkbox, Grid, Row, Col,Form, Button, FormGroup,FormControl,ControlLabel} from 'react-bootstrap';
import ActionModal from './ActionModal';
import {DATASET_TYPES, ANALYSIS_STATUSES, SOLVED_STATUSES} from './Constants';
import {FETCH_UPLOAD_USER_SAMPLES, CHECK_IF_SAMPLE_EXISTS,UPDATE_SAMPLE_FIELDS, UPDATE_DATASET_FIELDS,UPDATE_ANALYSIS_STATUS,FETCH_USER_LIST, UPDATE_ANALYSIS_FIELDS} from './Url.jsx';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';


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
                        let users = [];
                        data.forEach((userName) => {users.push(userName)});
                        this.setState({"userList": users});
        });
        this.addtoSelected = this.addtoSelected.bind(this);
        this.handleActionSelect = this.handleActionSelect.bind(this);
        this.resetSampleTableState = this.resetSampleTableState.bind(this);
        this.updateValues = this.updateValues.bind(this);
        this.onGridReady = this.onGridReady.bind(this);
        this.onBtExport = this.onBtExport.bind(this);
    }
    componentDidUpdate(prevProps,prevState){

        if(prevState.selectedSamples.length != 0 && this.state.selectedSamples.length == 0){

            this.setState({

                showActionSelect: false

            });

        }

    }
    onGridReady(params){
            this.gridApi = params.api;
            this.gridColumnApi = params.columnApi;
    }
    onBtExport(){
        let params = {
    
            fileName: this.props.cohortName

        }
        this.gridApi.exportDataAsCsv(params);

    }
    updateValues(field, oldValue, newValue, row){
        
        let UPDATE_URL = '';
        if(newValue != oldValue && newValue.length >0){

            let updateObj = { 'updateTo':newValue, 'field': field };
            if( field == 'AnalysisStatus'){

                updateObj['datasets'] = [{'analysisID': row.AnalysisID}];
                UPDATE_URL = UPDATE_ANALYSIS_STATUS;
            }
            else if (field=='RunID' || field == 'UploadDate' || field == 'SolvedStatus' || field == 'InputFile' || field == 'Notes' || field == 'DatasetType'){

                updateObj['datasets'] = [{'datasetID': row.id}];
                UPDATE_URL = UPDATE_DATASET_FIELDS;
            }
            else if(field == 'AssignedTo' || field == 'ResultsBAM'){

                updateObj['datasets'] = [{'analysisID': row.AnalysisID }];
                UPDATE_URL = UPDATE_ANALYSIS_FIELDS;
            }
            else if(field == 'PhenomeCentralSampleID' || field == "TissueType"){

                updateObj['samples'] = [{'sampleID': row.SampleID}];
                UPDATE_URL = UPDATE_SAMPLE_FIELDS;
            }
            else if(field == 'SampleID'){

                updateObj['samples'] = [{'sampleID': oldValue}];
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
    addtoSelected(event){
    
        if(event.node.selected == true){

            this.setState({
                
                    selectedSamples: [...this.state.selectedSamples,{"SampleID": event.node.data.SampleID, "datasetID":event.node.data.id, "analysisStatus":event.node.data.AnalysisStatus, "analysisID": event.node.data.AnalysisID}],
                    selected: this.state.selected.includes(event.node.data.id) ? this.state.selected : [...this.state.selected, event.node.data.id],
                    showActionSelect: true
            });
        }
        else{

            this.setState({

                    selectedSamples: this.state.selectedSamples.filter(dataObj => dataObj.datasetID!=event.node.data.id),
                    selected: this.state.selected.filter(datasetID => datasetID != event.node.data.id)
            });

        }

    }
    render() {
        let  columns = [
                    {field: 'SampleID', headerName:'Sample ID',headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true,sortable: true,filter: true,checkboxSelection: true, editable: true, pinned: 'left', cellClass: "lock-pinned",lockPinned: true, resizable: true, filter:'agTextColumnFilter', width: 250, 
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('SampleID', oldValue, newValue,data); }
                    }, 
                    {field: 'PhenomeCentralSampleID', headerName: 'PCID', sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('PhenomeCentralSampleID', oldValue, newValue,data); }
                    },
                    {field: 'AssignedTo', headerName:'Assigned to',sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100, cellEditor: 'agSelectCellEditor', cellEditorParams: {values: this.state.userList},
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('AssignedTo', oldValue, newValue,data); }
                    } ,
                    {field: 'DatasetType', headerName:"Dataset",sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100, cellEditor: 'agSelectCellEditor', cellEditorParams: {values: DATASET_TYPES},
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('DatasetType', oldValue, newValue,data); }
                    },
                    {field: 'RunID', headerName: 'Run ID', sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('RunID', oldValue, newValue,data); }
                    }, 
                    {field: 'TissueType', headerName:"Tissue",sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('TissueType', oldValue, newValue,data); }
                    },
                    {field: 'UploadDate', headerName: 'Upload Date', sortable:true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('UploadDate', oldValue, newValue,data); }
                    }, 
                    {field: 'SolvedStatus',headerName: 'Solved?', sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100, cellEditor: 'agSelectCellEditor', cellEditorParams: {values: SOLVED_STATUSES},
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('SolvedStatus', oldValue, newValue,data); }
                    },
                    {field: 'AnalysisStatus', headerName: 'Analysis Status',sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 100, cellEditor: 'agSelectCellEditor', cellEditorParams: {values: ANALYSIS_STATUSES},
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('AnalysisStatus', oldValue, newValue,data); }
                    },
                    {field: 'Notes', headerName: 'Notes',sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 400,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('Notes', oldValue, newValue,data); }
                    },
                    {field: 'InputFile',headerName: 'Input file', sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 400,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('InputFile', oldValue, newValue,data); }
                    } ,
                    {field: 'ResultsBAM', headerName: 'Result BAM',sortable: true,filter: true, editable: true, resizable: true, filter:'agTextColumnFilter',width: 800,
                        onCellValueChanged: ({oldValue, newValue, data}) => {this.updateValues('ResultsBAM', oldValue, newValue,data); }
                    }
        ];
    return  (

            <div> 
                <div style={{width: '100%'}}>
                    { this.state.showActionSelect &&
                                <Row>
                                <form>
                                    <Col md={2}>
                                        <FormGroup controlId='actionSelect_bottom' bsSize="sm" >
                                            <ControlLabel> With selected samples</ControlLabel>
                                            <FormControl  bsSize="sm" componentClass="select" placeholder="select" onChange={this.handleActionSelect} value={this.state.actionSelectValue}>
                                                <option value=""></option>
                                                {Object.keys(actionSelectOptions).map(opt => { return (<option key = {opt} value={opt} > {actionSelectOptions[opt]} </option> ); } )}
                                            </FormControl>
                                        </FormGroup>
                                    </Col>
                                </form>
                                </Row>
                    }
                </div>
                <div style={{margin:"10px 0px"}}>
                    <button onClick={this.onBtExport}>Export to CSV</button>
                </div>
                <div className="ag-theme-balham" style={{height: '750px', width: '100%' }} >
                    <AgGridReact
                        rowSelection="multiple"
                        suppressRowClickSelection={true}
                        columnDefs={columns}
                        rowData={this.props.samples}
                        onRowSelected={this.addtoSelected}
                        stopEditingWhenGridLosesFocus={true}
                        onGridReady={this.onGridReady}
                    />
                </div>
                {this.state.showActionModal && <ActionModal action={this.state.actionSelectValue} actionSelectOptions={actionSelectOptions} selectedSamples = {this.state.selectedSamples} sampleTableReset = {this.resetSampleTableState} />}
            </div>
    );
  }
}
