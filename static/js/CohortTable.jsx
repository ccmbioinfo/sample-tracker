import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter, selectFilter } from 'react-bootstrap-table2-filter';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import cellEditFactory, {Type}  from 'react-bootstrap-table2-editor';
import {ANALYSIS_STATUSES, SOLVED_STATUSES} from './Constants';
import {UPDATE_SAMPLE_FIELDS, UPDATE_DATASET_FIELDS,UPDATE_ANALYSIS_STATUS,FETCH_USER_LIST, UPDATE_ANALYSIS_FIELDS} from './Url.jsx';


const analysis_status_for_edits = [];
const analysis_status_for_filters = {};
ANALYSIS_STATUSES.forEach((analysisStatus) => {analysis_status_for_filters[analysisStatus] = analysisStatus; analysis_status_for_edits.push({value: analysisStatus,label: analysisStatus})});

const solved_status_for_edits = [];
const solved_status_for_filters = {};
SOLVED_STATUSES.forEach((solvedStatus) => { solved_status_for_filters[solvedStatus]=solvedStatus; solved_status_for_edits.push({value: solvedStatus,label: solvedStatus})});

const divStyle = {width: "2550px",fontSize : "0.85em"};
const customTotal = (from, to, size) => (

            <span className="react-bootstrap-table-pagination-total">
                Showing { from } to { to } of { size } 
            </span>
);
const options = { paginationTotalRenderer: customTotal, sizePerPageList: [ { text: '50', value: 50 }, { text: '100', value: 100 }, { text: '500', value: 500}], showTotal: true };
export default class CohortTable extends React.Component{

    constructor(props) {
        super(props);
        this.state={"userList": []}; 
        fetch(FETCH_USER_LIST)
        .then(resp => resp.json())
        .then(data => { 
                        let users = [{'value': '', label: ''}];
                        data.forEach((userName) => {users.push({'value':userName,label:userName})});
                        this.setState({"userList": users});
            });
    }

    render() {
   
        let  columns = [
                    {dataField: 'PhenomeCentralSampleID', text: 'PCID', sort: true,editable: true,editor: {type: Type.TEXT}, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'SampleID', text:'Sample ID',sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'AssignedTo', text:'Assigned to',sort: true, editable: true, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: this.state.userList}},
                    {dataField: 'DatasetType', text:"Dataset",sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'TissueType', text:"Tissue",sort: true, editable: true, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; },editor: {type: Type.TEXT}},
                    {dataField: 'UploadDate', text: 'Upload Date', sort:true, editable: false, headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'SolvedStatus',text: 'Solved?', sort: true, filter: selectFilter({ options: solved_status_for_filters }),headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: solved_status_for_edits}},
                    {dataField: 'AnalysisStatus', text: 'Analysis Status',sort: true, filter: selectFilter({ options: analysis_status_for_filters }), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editor: {type: Type.SELECT, options: analysis_status_for_edits} },
                    {dataField: 'InputFile',text: 'Input file', sort: true, editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; },editor: {type: Type.TEXT}},
                    {dataField: 'ResultsBAM', text: 'Result BAM',sort: true,editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }, editor: {type: Type.TEXT}},
                    {dataField: 'Notes', text: 'Notes',sort: true,editable: true,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }, editor: {type: Type.TEXT}},
        ];
    return  (

        <div style = {divStyle}>
        <ToolkitProvider  data={ this.props.samples } columns={ columns }  keyField='id'> 
                {
                    props => (
                    <div>
                    <BootstrapTable 
                    noDataIndication="..." { ...props.baseProps }  
                    pagination={  paginationFactory(options) } 
                    filter={ filterFactory() } 
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
                                                                                                else if (column.dataField == 'SolvedStatus' || column.dataField == 'InputFile' || column.dataField == 'Notes'){
                                                                                                        
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
                                                                                                    .then(data => alert('Updated!'));
                                                                                                }
                                                                                              }
                                                } } ) }
                    />
                    </div>
                    )
                }
            </ToolkitProvider>
        
        </div>
    );
  }
}
