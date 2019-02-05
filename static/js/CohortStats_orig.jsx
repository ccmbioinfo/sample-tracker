import React from "react";
import BootstrapTable from 'react-bootstrap-table-next';
import {Tabs, Tab,  Button} from 'react-bootstrap';
import {FETCH_COHORT_STATS} from './Url.jsx';

const divStyle = {width: "70%",margin: "10px auto"};
export default class CohortStats extends React.Component{

    constructor(props) {
        
        super(props);
        this.state = { cohorts: [] };
    }
   componentDidMount(){

        fetch(FETCH_COHORT_STATS)
        .then(resp => resp.json())
        .then(data => { this.setState({ cohorts: data });

            });

    }
    render() {
   
        let  columns = [
                    {dataField: 'CohortName', text:"Cohort Name",sort: true, editable: false}, 
                    {dataField: 'Families', text:"Families",sort: true, editable: false}, 
                    {dataField: 'Samples', text:"Samples",sort: true, editable: false}, 
                    {dataField: 'Processed', text:"Samples processed",sort: true, editable: false} 
                    
        ];
        return  (

            <div style={divStyle}>
                <BootstrapTable 
                    noDataIndication="No samples" 
                    keyField='CohortName' 
                    data={ this.state.cohorts } 
                    columns={ columns }
                    hover 
            />
            </div>
    );
    }
}
