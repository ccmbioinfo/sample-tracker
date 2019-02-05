import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import {Tabs, Tab,  Button} from 'react-bootstrap';
import {FETCH_COHORT_STATS,FETCH_UPLOAD_USER_SAMPLES} from './Url.jsx';
import CohortTable from './CohortTable';
//import 'react-perfect-scrollbar/dist/css/styles.css';
//import PerfectScrollbar from 'react-perfect-scrollbar';

const divStyle= {height: "800px",  margin: "25px 0px", overflow: "scroll"};
export default class CohortStats extends React.Component{

    constructor(props) {
        
        super(props);
        this.state = { cohorts: [],key:1,samples:[] };
        this.handleSelect = this.handleSelect.bind(this);
    }
   componentDidMount(){

        fetch(FETCH_COHORT_STATS)
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
    render() {

        let  columns = [
                    {dataField: 'CohortName', text:"Cohort Name",sort: true, editable: false, 
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
                    {dataField: 'Families', text:"Families",sort: true, editable: false}, 
                    {dataField: 'Samples', text:"Samples",sort: true, editable: false}, 
                    {dataField: 'Processed', text:"Samples processed",sort: true, editable: false} 
                    
        ];
        return  (

            <Tabs  style={{marginLeft:"25px"}} defaultActiveKey={1} onSelect={this.handleSelect} activeKey={this.state.key} id='CohortStatsTab'>   
            <Tab eventKey={1} title="index">
                <BootstrapTable 
                    noDataIndication="No samples" 
                    keyField='CohortName' 
                    data={ this.state.cohorts } 
                    columns={ columns }
                    hover 
                />
            </Tab>
            {this.state.cohorts.map( (cohort,index) => { return (<Tab key={index} eventKey={index+2} title={cohort.CohortName}><div style={divStyle}><CohortTable samples={this.state.samples}/></div></Tab>); }) }
            </Tabs>
        );
    }
}
