import React from "react";
import 'react-table/react-table.css'
import {FETCH_COHORT} from './Url.jsx';

export default class SampleExpandList extends React.Component {

	constructor(props) {
        	super(props);
                this.state = { 
                               info : ''
                             };
        }
        componentDidMount(){

            fetch(FETCH_COHORT+"/"+this.props.Project+"/"+this.props.Sample)
            .then((resp) => resp.json())
            .then((data)=>
			{

				if(Object.keys(data).length >0){

					
                               		this.setState({
                                        
                                                info: Object.keys(data[0]).map( (k) => "<li><b>"+k+"</b>"+" : "+ data[0][k]+"</li>").join("")
                                        });

                               }
                               else{

                               		this.setState({
                                                  
						info : ''
                                        });
                              }
                         }

                 );

         }

	render(){

		return (
	
			<ul>
			<div dangerouslySetInnerHTML={{__html: this.state.info}} />
			</ul>

		);

	}

}
