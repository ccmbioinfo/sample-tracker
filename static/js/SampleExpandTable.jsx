import React from "react";
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import {FETCH_COHORT} from './Url.jsx';

export default class SampleExpandTable extends React.Component {

	constructor(props) {
        	super(props);
                this.state = { 
                               info : [],
                               columns : []
                             };
        }
        componentDidMount(){

                fetch(FETCH_COHORT+"/"+this.props.Project+"/"+this.props.Sample)
                .then((resp) => resp.json())
                .then((data)=>
			{

				if(Object.keys(data).length >0){

                               		this.setState({
                                        
						columns: Object.keys(data[0]).map( (header) => { return {'accessor': header, 'Header': header} } ),                                              
                                                info: data
                                        });

                               }
                               else{

                               		this.setState({
                                                  
						info : [],
                                                columns : []
                                        });
                              }
                         }

                 );

         }

	render(){

		return (

			<ReactTable keyField='id' data={ this.state.info } columns = {this.state.columns} noDataText="Error fetching sample information" minRows={1} className="-striped -highlight" defaultPageSize={1}   showPagination={false} /> 
		);

	}

}
