import React from 'react';
import ReactDataGrid from 'react-data-grid';
import update from 'immutability-helper';
import moment from 'moment';
import Dropzone from 'react-dropzone';
import XLSX from 'xlsx';
import { Editors, Toolbar, Formatters } from 'react-data-grid-addons';
import {Panel,Glyphicon, Button, Popover,OverlayTrigger,Tooltip} from 'react-bootstrap';
import {FETCH_UPLOAD_CENTER_USER_LIST, GET_LOGGED_USER, CHECK_AND_FETCH_SAMPLE_INFO, CHECK_INPUT_FORM, INSERT_NEW_SAMPLES_INTO_DATABASE} from './Url.jsx';
import {DATASET_TYPES} from './Constants';

const {AutoComplete: AutoCompleteEditor, DropDownEditor } = Editors;
const {Row} = ReactDataGrid;
const Genders = ['','Male','Female']; 
const requiredColumns = {'FamilyID':'Family ID','SampleName': 'Sample name','DatasetType': 'Dataset type'};
const AffectedStatuses = ['','Affected','Unaffected'];
const FamilyDropDown = ['','Proband','Mother','Father','Sibling','Other family member'];

const defaultToolTip = (<Popover id="defaultTip" title="Error">Error!</Popover>);
const FamilyIDErrorTooltip = (<Popover id="FamilyIDtip" title="Error">FamilyID is taken by another lab. Please enter a new FamilyID.</Popover>);
const SampleErrorTooltip = (<Popover id="SampleNametip" title="Error">Sample name is taken by another lab. Please enter a new sample name.</Popover>);
const CohortErrorTooltip = (<Popover id="CohortNametip" title="Error">Cohort name is taken by another lab. Please enter a new cohort name.</Popover>);
const SampleExistsTooltip = (<Popover id="SampleExiststip" title="Information">This sample was previously deposited into database. Gender and Family information values have been autofilled.</Popover>);
const fields2ErrorToolTips = {'FamilyID': FamilyIDErrorTooltip, 'SampleName': SampleErrorTooltip, 'CohortName': CohortErrorTooltip};

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
        else if('existingSamples' in this.props.column && this.props.column.existingSamples.includes(this.props.value)){

            return(
                <OverlayTrigger trigger={['hover','focus']} placement='right' overlay={SampleExistsTooltip || defaultToolTip}>
                <div style={{color: "green"}}>{this.props.value}</div>
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
export default class ManualInputTable extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = { 
                        rows: this.createRows(),
                        warnValues:[],
                        activeRows: [],
                        existingSamples: [],
                        accessLevel: '',
                        existingUsers: []
        };

        this.createRows = this.createRows.bind(this);
        this.rowGetter = this.rowGetter.bind(this);
        this.handleGridRowsUpdated = this.handleGridRowsUpdated.bind(this);
        this.handleSaveData = this.handleSaveData.bind(this);
        this.duplicateRow = this.duplicateRow.bind(this);
        this.clearRow = this.clearRow.bind(this);
        this.checkUpdatedValues = this.checkUpdatedValues.bind(this);
        this.checkExistingSamples = this.checkExistingSamples.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.setStateExplicit = this.setStateExplicit.bind(this);
    }
    componentDidMount(){

        fetch(GET_LOGGED_USER)
        .then(resp => resp.json())
        .then(data => this.setState({accessLevel: data.accessLevel}));

        fetch(FETCH_UPLOAD_CENTER_USER_LIST)
        .then(resp => resp.json())
        .then(data => this.setState({existingUsers: ['',...data]}));        
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
            let SampleID = '';
            if('FamilyID' in updated){
    
                SampleID = updated.FamilyID;
                if('SampleName' in rowToUpdate && rowToUpdate.SampleName.length >0){


                    SampleID+="_"+rowToUpdate.SampleName;

                }
                updated = {'FamilyID':updated.FamilyID, 'SampleID': SampleID}

            }
            if('SampleName' in updated){

                if('FamilyID' in rowToUpdate && rowToUpdate.FamilyID.length >0){

                     SampleID = rowToUpdate.FamilyID+"_";
                }
                SampleID+=updated.SampleName;
                updated = {'SampleName':updated.SampleName, 'SampleID':SampleID}

            }
            let updatedRow = update(rowToUpdate, {$merge: updated});
            rows[i] = updatedRow;
        }
        this.setState({ 
                        rows: rows,
                        activeRows: rows.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.id)
         });
        this.checkUpdatedValues(updated);
        if('SampleID' in updated){

            this.checkExistingSamples(updated['SampleID'],fromRow);

        }
    }
    checkExistingSamples(SampleID,row){

        if(SampleID.length >0){

            fetch(CHECK_AND_FETCH_SAMPLE_INFO+"/"+SampleID)
            .then(resp => resp.json())
            .then((data) => {

                    if('Gender' in data && 'SampleType' in data){

                        this.setState({
    
                            existingSamples: [...this.state.existingSamples,SampleID]
    
                        });
                        let rows = this.state.rows.slice();
                        let updatedRow = update(rows[row], {$merge: data});
                        rows[row] = updatedRow;
                        this.setState({rows: rows});
                    }
            });  
        }   
    }
    checkUpdatedValues(updated){
        //check values from db here.
        Object.keys(updated).forEach(

                    (field) => {
                            
                             
                            if(Object.keys(requiredColumns).includes(field) && updated[field]!==undefined && updated[field].length>0){

                                    fetch(CHECK_INPUT_FORM+"/"+field+"/"+updated[field])
                                    .then(resp => resp.json())
                                    .then(data => 
                                                 {
                                                    if(data.Status == 'Error'){

                                                        this.setState({

                                                            warnValues: [...this.state.warnValues,updated[field]]
                                                       
                                                         });

                                                    }

                                                }
                                    );

                            }

                    }

        );

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

            fetch(INSERT_NEW_SAMPLES_INTO_DATABASE,{
    
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
            
                        console.log(data);
                        if(data.Status == 'Success'){
    
                            alert('Samples deposited into datbase');
                            this.setState({ existingSamples:[], warnValues:[], rows: this.createRows(), activeRows: [] });
                        }
                        else{
                            
                            alert('Error inserting samples into database. Please contact Teja!');
    
                        }
                
    
                }
            );
        } 

    }
  setStateExplicit(objArray,checkUpdatedValues, checkExistingSamples){
  
        this.setState({

                        rows:objArray,
                        activeRows:objArray.filter(row => Object.values(row).filter(value => String(value).length >=3).length >=1).map(row => row.id)
        }); 
        objArray.forEach((row,index) => {
                
                checkUpdatedValues(row);
                if('SampleID' in row){

                    checkExistingSamples(row['SampleID'],index);

                }
        });
  }
  onDrop(files) {

        let ExcelHeader2Keys = {'PhenomeCentral ID': 'PhenomeCentralSampleID','FamilyID': 'FamilyID','Sample name':'SampleName','Gender':'Gender','Family information':'SampleType','Dataset type':'DatasetType','Cohort name':'CohortName','Run ID':'RunID','Notes':'Notes'}; // only used in this function. we can move it up top if we need it somewhere else 
        if(this.state.accessLevel == 'Admin'){
        
            ExcelHeader2Keys['Upload as'] = 'UploadUser';

        }

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
        let checkUpdatedValues = this.checkUpdatedValues;
        let checkExistingSamples = this.checkExistingSamples;

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
                if('FamilyID' in rowUpdatedObj && 'SampleName' in rowUpdatedObj){

                    rowUpdatedObj['SampleID'] = rowUpdatedObj['FamilyID']+"_"+rowUpdatedObj['SampleName'];

                }
                excelRows.push(rowUpdatedObj);
                maxRowID++;
            });
        
        };
        reader.onloadend = () => {
        
            setStateExplicitly(excelRows,checkUpdatedValues, checkExistingSamples);
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
      { key: 'PhenomeCentralSampleID', name: 'PhenomeCentral ID', editable:true,resizable:true,width:150, visible: true },
      { key: 'FamilyID', name: 'FamilyID',editable:true,resizable:true, width:130, visible: true,warnValues:this.state.warnValues, formatter: <FieldFormatter />},
      { key: 'SampleName', name: 'Sample name', editable:true,resizable:true,width:150, visible: true,warnValues:this.state.warnValues, formatter: <FieldFormatter />}, 
      { key: 'SampleID', name: 'Sample ID (auto populated)',resizable:true,width:200, visible: true,existingSamples: this.state.existingSamples, formatter: <FieldFormatter />}, 
      {key: 'Gender', name: 'Gender',editable:true,resizable:true,width:100, editor: <DropDownEditor options={Genders} />, visible: true},
      { key: 'SampleType', name: 'Family information',editable:true,resizable:true,width:150, visible: true, editor: <DropDownEditor options={FamilyDropDown} /> },
      { key: 'DatasetType', name: 'Dataset type', editable:true,resizable:true,width:150, visible: true, editor: <DropDownEditor options={DATASET_TYPES} /> },
      { key: 'TissueType', name: 'Tissue type',editable:true,resizable:true,width:150, visible: true },
      { key: 'CohortName', name: 'Cohort name', editable:true,resizable:true,width:250, visible: true, warnValues:this.state.warnValues, formatter: <FieldFormatter />},
      { key: 'RunID', name: 'Run ID',editable:true,resizable:true,width:100, visible: true },
      { key: 'Notes', name: 'Notes',editable:true,resizable:true,width:this.state.accessLevel == 'Admin' ? 150:400, visible: true },
      { key: 'UploadUser', name: 'Upload as', editable:true,resizable:true,width:250, visible: this.state.accessLevel == 'Admin' ? true:false, editor: <DropDownEditor options={this.state.existingUsers} />  }
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
        cellNavigationMode="changeRow"
        />
      </Dropzone>
      <Panel>
            <Panel.Body>
            You can also drag and drop an excel (.xls or .xlsx) file onto the table above. Use this <a href='/files/uploadTemplate' download='upload_template.xls'>template</a> to fill in data for upload (<b>Warning</b>: Dropping a file onto the table will clear any existing data in the table).<br/>
                <b>Instructions</b>
                <ol>
                    <li><b> FamilyID, Sample name, Dataset type </b> are required columns. </li>
                    <li><b> Sample ID</b> column is auto populated. Format of Sample ID is Family ID_Sample name.</li>
                    <li> Samples with no Cohort name will be entered into a default cohort named '<b>Global</b>'.</li>
                    <li> Once entered, information cant be updated, so please double check the data before inserting  it into the database.</li>
                </ol>

            </Panel.Body>  
    </Panel>
      <Button  bsStyle="primary" bsSize="large" block onClick={this.handleSaveData}>Click here to insert samples into database</Button>
      </div>
    );
  }

}

