import React from 'react';
import ReactDataGrid from 'react-data-grid';
import update from 'immutability-helper';
import moment from 'moment';
import Dropzone from 'react-dropzone';
import XLSX from 'xlsx';
import { Editors, Toolbar, Formatters } from 'react-data-grid-addons';
import {Panel,Glyphicon, Button, Popover,OverlayTrigger,Tooltip} from 'react-bootstrap';
import {CHECK_IF_SAMPLE_EXISTS, CHECK_UPDATE_SAMPLE_INFO, UPDATE_SAMPLE_STATUS_IN_DATABASE} from './Url.jsx';
import {DATASET_TYPES,UPDATER_ANALYSIS_STATUSES} from './Constants';

const {AutoComplete: AutoCompleteEditor, DropDownEditor } = Editors;
const {Row} = ReactDataGrid;
const requiredColumns = {'SampleID':'Sample ID','DatasetType':'Dataset Type','UploadDate': 'Analysis/Reanalysis requested date','Status': 'Analysis Status'};
const BOOLTypes = ['','Y'];

const defaultToolTip = (<Popover id="defaultTip" title="Error">Error!</Popover>);
const SampleIDErrorTooltip = (<Popover id="SampleNametip" title="Error">Sample ID is not found in database. Please correct it.</Popover>);
const fields2ErrorToolTips = {'SampleID': SampleIDErrorTooltip};

const addIcon = <Glyphicon glyph='plus' />;
const removeIcon = <Glyphicon glyph='minus' />;
const pencilIcon = <Glyphicon glyph='pencil' />;
const iconStyle = { marginLeft:"0.7em", display:"inline", fontSize:" 0.5em" };

const defaultRows = 6;


class IDFormatter extends React.Component{

    constructor(props){

        super(props);

    }
    render(){

        return(
    
            <div>
            {this.props.value}
            {this.props.value >=defaultRows-1 && this.props.column.activeRows.includes(this.props.value) 
                &&
            <Button style={iconStyle} onClick={() => this.props.column.onPlusClick(this.props.value,1)}>{pencilIcon}</Button>
            }
            {this.props.column.activeRows.includes(this.props.value) && 
            <Button style={iconStyle} onClick={() => this.props.column.onPlusClick(this.props.value)}>{addIcon}</Button>
            }
            {this.props.column.activeRows.includes(this.props.value) &&
            <Button style={iconStyle} onClick={() => this.props.column.onMinusClick(this.props.value)}>{removeIcon}</Button>
            }
            </div>
        );
    }

}
class FieldFormatter extends React.Component{

    constructor(props){

        super(props);
        
    }
    render(){

        if( 'warnValues' in this.props.column && this.props.column.warnValues.includes(this.props.value)){
    
            return(
                <OverlayTrigger trigger={['hover','focus']} placement='right' overlay={fields2ErrorToolTips[this.props.column.key] || defaultToolTip}>
                <div style={{color: "red"}}>{this.props.value}</div>
                </OverlayTrigger>
            );
        }
        else{
 
            return(
            
                <div style={{color: "black"}}>{this.props.value}</div>

            );
        }
    }

}
export default class ManualUpdateTable extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = { 
                        rows: this.createRows(),
                        warnValues:[],
                        activeRows: []
        };

        this.createRows = this.createRows.bind(this);
        this.rowGetter = this.rowGetter.bind(this);
        this.handleGridRowsUpdated = this.handleGridRowsUpdated.bind(this);
        this.handleSaveData = this.handleSaveData.bind(this);
        this.duplicateRow = this.duplicateRow.bind(this);
        this.clearRow = this.clearRow.bind(this);
        this.checkIFSampleExists = this.checkIFSampleExists.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.setStateExplicit = this.setStateExplicit.bind(this);
    }
    createRows () {
        let rows = [];
        for (let i = 1; i < defaultRows; i++) {
            rows.push({
                'id': i
             });
        }
        

        return rows;
    };

    rowGetter (i){
        return this.state.rows[i];

    };
    duplicateRow(rowID, blank = 0){

        let maxActiveRow = Math.max(...this.state.activeRows) ;
        let rows = this.state.rows.slice();
        if(rows.length==maxActiveRow){

            rows.push({'id':maxActiveRow+1});
        }
        if(blank == 0){
   
            let toDupObj = Object.assign({},this.state.rows[rowID-1]);
            delete toDupObj['id']; //dont wanna duplicate ID
            let updatedRow = update(rows[maxActiveRow],{$merge: toDupObj});
            rows[maxActiveRow] = updatedRow;
        }
        this.setState({
                        rows: rows,
                        activeRows: rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.id)
                    });
    }
    clearRow(rowID){

        let toClearObj = Object.assign({},this.state.rows[rowID-1]);
        delete toClearObj['id']; //dont wanna clear ID
        Object.keys(toClearObj).forEach((Key) => {

                                                    toClearObj[Key] = '';
                                        });
        let rows = [];
        let updatedRow = '';
        rows = this.state.rows.slice();
        updatedRow = update(rows[rowID-1],{$merge: toClearObj});
        rows[rowID-1] = updatedRow;
        let maxActiveRow = Math.max(...this.state.activeRows);
        if(rowID == maxActiveRow && rowID > defaultRows-1){

            rows.pop();

        }
        this.setState( (prevState,currentProps) => { return {
                        rows: rows,
                        activeRows: prevState.activeRows.filter((ID)=> ID!=rowID)
                    }
                    } );
    }

    handleGridRowsUpdated ({ fromRow, toRow, updated }) {

        let rows = this.state.rows.slice();
        for (let i = fromRow; i <= toRow; i++) {
            
            let rowToUpdate = rows[i];
            let updatedRow = update(rowToUpdate, {$merge: updated});
            rows[i] = updatedRow;
        }
        this.setState({ 
                        rows: rows,
                        activeRows: rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.id)
         });
        console.log(updated);
        if('SampleID' in updated){

            this.checkIFSampleExists(updated['SampleID']);

        }
    }
    checkIFSampleExists(SampleID){

        fetch(CHECK_IF_SAMPLE_EXISTS+"/"+SampleID)
        .then(resp => resp.json())
        .then((data) => {

                    if(data.Exists == 0){

                        this.setState({
   
                            warnValues: [...this.state.warnValues,SampleID]
    
                        });
                    }
        });     
    }
    handleSaveData(){
        
        let errorsExist = 0;
        let total= this.state.rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1); 
        if(total == 0){

            alert('No samples to insert');
            return;
        }
        for(let i =0; i<this.state.rows.length;i++){


            if (Object.values(this.state.rows[i]).filter(value => String(value).length >=3).length >=1){ // if there is data in atleast one cell (other than the ID cell)
                    
                let retErrorCols = [];
                Object.keys(requiredColumns).forEach(
                
                    (col) => {

                        if (! (col in this.state.rows[i])|| (this.state.rows[i][col] == '')){

                            retErrorCols.push(requiredColumns[col]);
                        
                        }

                    }
        
                );
                if(retErrorCols.length >0){

                    alert('Please fill columns '+ retErrorCols.join(",")+ " for sample No."+ (i+1));
                    errorsExist=1;
                    break;
                }

                if(Object.values(this.state.rows[i]).map(val => this.state.warnValues.includes(val)).includes(true)){
        
                    alert('There are still some errors in the input data. Please check for cells with red colored text and fix them');
                    errorsExist=1;
                    break;
                }
            }
        }
        let SampleIDArray = this.state.rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.SampleID)
        // check for duplicate rows (based on SampleID for now);
        let dupSampleIDs= [];
        for(let i=0;i<SampleIDArray.length;i++){

            for(let j=i+1;j<SampleIDArray.length;j++){

                if(SampleIDArray[i] == SampleIDArray[j]){

                    if (!dupSampleIDs.includes(SampleIDArray[i])){

                        dupSampleIDs.push(SampleIDArray[i]);

                    }
                }

            }

        }
        if(dupSampleIDs.length >0){

            alert('SampleIDs '+dupSampleIDs.join(", ")+" are repeated in the input.Please correct them.");
            errorsExist=1;
        
        }
        if(! errorsExist){

            fetch(CHECK_UPDATE_SAMPLE_INFO,{

                method: "post",
                headers: {

                    'Accept': 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.getElementById('csrf_token').value
                },
                body: JSON.stringify({"samples":this.state.rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length>=3)})
            })
            .then(response => response.json())
            .then(data => {

                            if(data.Errors.length >0){

                                alert(data.Errors.join("\n"));
                                errorsExist=1;
                            }
                            else{
                                    
                                fetch(UPDATE_SAMPLE_STATUS_IN_DATABASE,{
        
                                    method: "post",
                                    headers: {
        
                                            'Accept': 'application/json, text/plain, */*', 
                                            'Content-Type': 'application/json',
                                            'X-CSRFToken': document.getElementById('csrf_token').value
                                    },
                                    body: JSON.stringify({"samples":this.state.rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length>=3)})
                                })
                                .then(response =>response.json())
                                .then(data => {
            
                                            if(data.Status == 'Success'){
    
                                                alert('Samples updated in datbase');
                                                this.setState({ warnValues:[], rows: this.createRows(), activeRows: [] });
                                            }
                                            else{
                            
                                                alert('Error updating samples. Please contact Teja!');
    
                                            }
    
                                });

                            }

            });

        } 

    }
  setStateExplicit(objArray,checkIFSampleExists){
  
        this.setState({

                        rows:objArray,
                        activeRows:objArray.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.id)
        }); 
        objArray.forEach((row,index) => {
                
                if('SampleID' in row){

                    checkIFSampleExists(row['SampleID']);

                }
        });
  }
  onDrop(files) {

        const ExcelHeader2Keys = {'Sample ID': 'SampleID','Dataset type': 'DatasetType', 'Analysis requested date': 'UploadDate', 'Analysis Status': 'Status', 'Pipeline version': 'PipelineVersion', 'Input file': 'InputFile', 'Result directory': 'ResultsDirectory', 'Result BAM': 'ResultsBAM', 'Notes': 'Notes'}; 
        let wrongExtensionError = 0;
        files.forEach( (file) => { 
        
            let extension = file.name.split('.').pop();
            if(extension!='xls' && extension!='xlsx'){

                wrongExtensionError = 1;

            }

        });
        if(wrongExtensionError){

            alert('Please upload either xls or xlsx files');
            return ;

        }
        let setStateExplicitly = this.setStateExplicit;
        let checkIFSampleExists  = this.checkIFSampleExists;

        let maxRowID = 1; 
        let reader = new FileReader(); //file reader API 
        let excelRows = []; 
        reader.onload = (e) => {

            let data = e.target.result;
            let workbook = XLSX.read(data, {type: 'binary'});
            let sampleData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {header:1});
            let header2Index = {};
            sampleData.shift().forEach((headerCol,headerIndex) => {

                    header2Index[headerIndex] = headerCol;
                }
            );
            sampleData.forEach((row) => {

                let rowUpdatedObj = { 'id': maxRowID }; 
                row.forEach((col, index) => {

                    rowUpdatedObj[ExcelHeader2Keys[header2Index[index]]] = col;
                });
                excelRows.push(rowUpdatedObj);
                maxRowID++;
            });
        
        };
        reader.onloadend = () => {
        
            setStateExplicitly(excelRows,checkIFSampleExists);
        }
        reader.onerror = () => {

            alert('Error reading file. Please try again');

        }
        let toProcessFile = files.pop();
        reader.readAsBinaryString(toProcessFile); 
  }
  render() {
      const columns = [
      { key: 'id', name: 'No.',width:150,visible: true,onPlusClick:this.duplicateRow,onMinusClick:this.clearRow, activeRows: this.state.activeRows, formatter:<IDFormatter />},
      { key: 'SampleID', name: 'Sample ID', editable:true,resizable:true,width:150,visible: true,warnValues:this.state.warnValues, formatter: <FieldFormatter />}, 
      { key: 'DatasetType', name: 'Dataset type', editable:true,resizable:true,width:100, visible: true, editor: <DropDownEditor options={DATASET_TYPES} /> },
      { key: 'UploadDate', name: 'Analysis/Reanalysis requested date(yyyy-mm-dd)', editable:true,resizable:true,width:360, visible: true  },
      { key: 'Status', name: 'Analysis Status', editable:true,resizable:true,width:125, visible: true, editor: <DropDownEditor options={UPDATER_ANALYSIS_STATUSES} /> },
      { key: 'PipelineVersion', name: 'Pipeline version', editable:true,resizable:true,width:125, visible: true },
      { key: 'InputFile', name: 'Input file(s)', editable:true,resizable:true,width:250, visible: true },
      { key: 'ResultsDirectory', name: 'Result directory', editable:true,resizable:true,width:250, visible: true },
      { key: 'ResultsBAM', name: 'Result BAM', editable:true,resizable:true,width:250, visible: true },
      { key: 'Notes', name: 'Notes',editable:true,resizable:true,width:250, visible: true }
    ];
    return  (
      <div style={{width:"2000px"}}>
      <Dropzone
        disableClick
        style={{position: "relative"}}
        onDrop={this.onDrop}
      >
      <ReactDataGrid
        enableCellSelect={true}
        columns={columns.filter(column=>column.visible === true)}
        rowGetter={this.rowGetter}
        rowsCount={this.state.rows.length}
        onGridRowsUpdated={this.handleGridRowsUpdated}
        minHeight={this.state.rows.length > defaultRows ? defaultRows*50 + (this.state.rows.length -5)*40 : defaultRows*50 } 
        />
      </Dropzone>
      <Panel>
            <Panel.Body>
                You can also drag and drop an excel (.xls or .xlsx) file onto the table above. Use this <a href='/files/updateTemplate' download='Update_template.xls'>template</a> to fill in data for upload (<b>Warning</b>: Dropping a file onto the table will clear any existing data in the table).<br/>
                <b>Instructions</b>
                <ol>
                    <li> <b>SampleID, Dataset type, Date Uploaded/Reanalysis requested</b> and <b>Analysis Status</b> columns are required. </li>
                    <li> Please enter either the date on which a sample is uploaded (for new samples) or the date on which Reanalysis was requested (for reanalysis samples) for <b>Date Uploaded/Reanalysis requested</b> column. </li>
                    <li> You can leave the other fields blank if you dont want to overwrite their existing values in database.</li>
                </ol>
            </Panel.Body>
      </Panel>
      <Button  bsStyle="primary" bsSize="large" block onClick={this.handleSaveData}>Click here to update sample status in database</Button>
      </div>
    );
  }

}

