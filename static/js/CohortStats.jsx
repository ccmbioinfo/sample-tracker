import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import {PanelGroup, Grid, Row, Form, FormGroup,FormControl,ControlLabel,Col,Tabs, Tab,  Button} from 'react-bootstrap';
import cellEditFactory, {Type}  from 'react-bootstrap-table2-editor';
import ToolkitProvider, { CSVExport } from 'react-bootstrap-table2-toolkit';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { textFilter, dateFilter, selectFilter } from 'react-bootstrap-table2-filter';
import {FETCH_PROJECT_LIST, FETCH_COHORT_STATS,FETCH_UPLOAD_USER_SAMPLES, UPDATE_COHORT_FIELDS} from './Url.jsx';
import CohortTable from './CohortTable';

const divStyle= {overflow: "scroll",  margin: "25px 10px"};
export default class CohortStats extends React.Component{

    constructor(props) {
        
        super(props);
        this.state = {projects: [],selectedProject: '', cohorts: [],key:1,samples:[] };
        this.handleSelect = this.handleSelect.bind(this);
        this.fetchCohorts = this.fetchCohorts.bind(this);
    }
   componentDidMount(){

        fetch(FETCH_PROJECT_LIST)
        .then(resp => resp.json())
        .then(data => {this.setState({projects: data }); });

        fetch(FETCH_COHORT_STATS+"/ALL")
        .then(resp => resp.json())
        .then(data => { this.setState({ cohorts: data }); });

    }
    handleSelect(key){

        this.setState({ key:key,samples:[] });

        if(key>1){

            fetch(FETCH_UPLOAD_USER_SAMPLES+"/"+this.state.cohorts[key-2].CohortName)
            .then((resp) => resp.json())
            .then((data)=> this.setState({ samples: data}));
        }


    }
    fetchCohorts(event){

        this.setState({selectedProject: event.target.value, key:1});

        fetch(FETCH_COHORT_STATS+"/"+event.target.value)
        .then(resp => resp.json())
        .then(data => { this.setState({ cohorts: data }); });
    }
    render() {

        let  columns = [
                    {dataField: 'CohortName', text:"Cohort Name",sort: true, editable: true,headerStyle: (colum, colIndex) => {return { width: '350px' }},editor: {type: Type.TEXT},
                                formatter: (cell,row) => {
                                                          let cohortIndex = -1; 
                                                          this.state.cohorts.forEach((cohort,index) => {
                                                                                        if(cohort.CohortName == row.CohortName){

                                                                                            cohortIndex = index+2;

                                                                                        }
                                                                                    }); 
                                                            return (<a href='#' onClick={(e) => this.handleSelect(cohortIndex,e)}>{row.CohortName}</a>);
                                                        }
                    }, 
                    {dataField: 'Families', text:"Families",sort: true, editable: false,headerStyle: (colum, colIndex) => {return { width: '150px' }} }, 
                    {dataField: 'Samples', text:"Samples",sort: true, editable: false, headerStyle: (colum, colIndex) => {return { width: '150px' }} }, 
                    {dataField: 'Processed', text:"Samples processed",sort: true, editable: false, headerStyle: (colum, colIndex) => {return { width: '200px'}} },
                    {dataField: 'CohortDescription', text:"Notes",sort: false, editable: true,editor: {type: Type.TEXT}} 
                                        
        ];
        return  (
        
            <div style = {divStyle}>
            <Grid>
                <Row>
                    <Col md={6} lg={6} mdOffset={3} lgOffset={3}>
                    <Form>
                        <FormGroup controlId="projectSelect" bsSize="sm">
                            <ControlLabel>
                                Select a project to view cohort list:
                            </ControlLabel>
                            <FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.fetchCohorts} value={this.state.selectedProject}>
                                <option value="ALL">ALL</option>
                                {this.state.projects.map( (proj,index) => <option key = {index} value={proj} >{proj}</option> )}
                            </FormControl>
                        </FormGroup>
                    </Form>
                    </Col>
                </Row>
            </Grid>
            <Tabs defaultActiveKey={1} onSelect={this.handleSelect} activeKey={this.state.key} id='CohortStatsTab'>   
            <Tab eventKey={1} title="index">

                <div style={{width:"2000px"}}>
                <ToolkitProvider  data={ this.state.cohorts } columns={ columns }  keyField='CohortID'>
                {
                    props => (
                    <div>
                    <BootstrapTable
                    noDataIndication="No cohorts" { ...props.baseProps }
                    cellEdit={  cellEditFactory({
                                                mode: 'dbclick',
                                                blurToSave: true,
                                                afterSaveCell: (oldValue, newValue, row, column) => {

                                                                                                        if(newValue != oldValue && newValue.length >0){
                                                                                                            
                                                                                                            let updateObj = { 'updateTo':newValue,'CohortID': row.CohortID, 'field':column.dataField };
                                                                                                            fetch(UPDATE_COHORT_FIELDS,{
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
                                                })
                            }
                    />
                    </div>
                    )
                }
                </ToolkitProvider>
                </div>
            </Tab>
            {this.state.cohorts.map( (cohort,index) => { return (<Tab key={index} eventKey={index+2} title={cohort.CohortName}><div style={divStyle}><CohortTable samples={this.state.samples}/></div></Tab>); }) }
            </Tabs>
            </div>
        );
    }
}
