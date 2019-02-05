import React from "react";
import { Image,PanelGroup, Radio, Grid, Row, Panel, Form, Button, FormGroup,FormControl,ControlLabel,Checkbox,Col} from 'react-bootstrap';
import {UPDATE_ANALYSIS_STATUS} from './Url.jsx';
import {ANALYSIS_STATUSES} from './Constants';

export default class AnalysisStatusModal extends React.Component {

	constructor(props) {
        super(props);
        this.state = {
            selectedDropDownStatus: '',
            buttonDisabled: true
        };
		this.setValue = this.setValue.bind(this);
        this.updateAnalysisStatus = this.updateAnalysisStatus.bind(this);

    }
    setValue(event){

		this.setState({

			selectedDropDownStatus: event.target.value,
			buttonDisabled: event.target.value.length == 0 ? true : false
		});

	}
    updateAnalysisStatus(){


        fetch(UPDATE_ANALYSIS_STATUS,{

                    method: "post",
                    headers: {

                        'Accept': 'application/json, text/plain, */*',
                        'Content-Type': 'application/json',
                        'X-CSRFToken': document.getElementById('csrf_token').value
                    },
                    body: JSON.stringify({"datasets":this.props.selectedSamples,"updateTo":this.state.selectedDropDownStatus})
             })
            .then(response =>response.json())
            .then(data => alert('Updated!')); 

    }
	render(){
    
		return (
		
			<Form>
				<FormGroup controlId="updateAnalysisStatus" bsSize="sm">
					<ControlLabel>
						Update Analysis status to 
					</ControlLabel>
					<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.setValue} value={this.state.selectedDropDownStatus}>
						<option value=""></option>
                        {ANALYSIS_STATUSES.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
					</FormControl>
				</FormGroup>
			
			<Button disabled={this.state.buttonDisabled} onClick={this.updateAnalysisStatus}>Submit</Button>
			</Form>
			

		);

	}

}
