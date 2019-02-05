import React from "react";
import {OverlayTrigger,Popover} from 'react-bootstrap';
import {FETCH_ANALYSIS_HISTORY} from './Url.jsx';

export default class AnalysisPopOver extends React.Component{

        constructor(props){

                super(props);
		this.state={

				analysisHistory: {
		
							'PipelineVersion':'', 
							'history': []

				}

		};

        }
	componentDidMount(){

		fetch(FETCH_ANALYSIS_HISTORY+"/"+this.props.sampledetails.AnalysisID)
                .then((resp) => resp.json())
                .then((data)=> this.setState({

                        	analysisHistory: data

                }));

	}
        render(){

		const popoverHoverFocus= (

			<Popover id="Status update popup" title="Status update history">
		
				<p><b>Pipeline version: </b> {this.state.analysisHistory.PipelineVersion}</p>	
				{ this.state.analysisHistory.history.map((step,index) => {

										return (<p key={index}><b>{index+1}) </b> Updated to <b>{step[0]}</b> on {step[1]} by {step[2]}</p>);

										}
									)
				}
 
 			</Popover>

		);
                return(

			<div>
			<OverlayTrigger trigger={['hover','focus']} placement="right" overlay={popoverHoverFocus} >
                        <a href='#'> { this.props.sampledetails.AnalysisStatus}</a>
			</OverlayTrigger>
			</div>
                );
        }
}
