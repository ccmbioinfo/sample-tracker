import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter, selectFilter } from 'react-bootstrap-table2-filter';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import cellEditFactory, {Type}  from 'react-bootstrap-table2-editor';
import {ANALYSIS_STATUSES, SOLVED_STATUSES} from './Constants';
import {UPDATE_SOLVED_STATUS,UPDATE_ANALYSIS_STATUS} from './Url.jsx';


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
let  columns = [
                    {dataField: 'PhenomeCentralSampleID', text: 'PCID', sort: true,editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'FamilyID', text:'Family ID', sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'SampleName', text:'Sample Name',sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'SampleID', text:'Sample ID',sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'DatasetType', text:"Dataset",sort: true, editable: false, filter: textFilter(), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'UploadDate', text: 'Upload Date', sort:true, editable: false, headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }},
                    {dataField: 'Status',text: 'Solved?', sort: true, filter: selectFilter({ options: solved_status_for_filters }),headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editable: (content, row, rowIndex, columnIndex) => content.toLowerCase()!='solved',  editor: {type: Type.SELECT, options: solved_status_for_edits}},
                    {dataField: 'AnalysisStatus', text: 'Analysis Status',sort: true, filter: selectFilter({ options: analysis_status_for_filters }), headerStyle: (colum, colIndex) => {return { width: '150px', textAlign: 'center' }; }, editable: (content, row, rowIndex, columnIndex) => content.toLowerCase()!='done',  editor: {type: Type.SELECT, options: analysis_status_for_edits} },
                    {dataField: 'InputFile',text: 'Input file', sort: true, editable: false,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }},
                    {dataField: 'ResultsBAM', text: 'Result BAM',sort: true,editable: false,headerStyle: (colum, colIndex) => {return { width: '750px', textAlign: 'center' }; }},
];
const options = { paginationTotalRenderer: customTotal, sizePerPageList: [ { text: '50', value: 50 }, { text: '100', value: 100 }, { text: '500', value: 500}], showTotal: true };
export default class CohortTable extends React.Component{

    constructor(props) {
        super(props);
    }

    render() {
   
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
                                                                                                if(newValue != oldValue){

                                                                                                let UPDATE_URL = '';    
                                                                                                let updateObj = { 'updateTo':newValue };
                                                                                                if(column.dataField == 'AnalysisStatus'){
                                                                                                    
                                                                                                    updateObj['datasets'] = [{'analysisID': row.AnalysisID}];
                                                                                                    UPDATE_URL = UPDATE_ANALYSIS_STATUS;
                                                                                                }
                                                                                                else if (column.dataField == 'Status'){

                                                                                                        updateObj['datasets'] = [{'datasetID': row.id}];
                                                                                                        UPDATE_URL = UPDATE_SOLVED_STATUS;    
                                                                                                 }

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
