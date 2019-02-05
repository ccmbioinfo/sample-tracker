import React from "react";
import { Image,PanelGroup, Radio, Grid, Row, Panel, Form, Button, FormGroup,FormControl,ControlLabel,Checkbox,Col} from 'react-bootstrap';
import {UPDATE_SOLVED_STATUS} from './Url.jsx';
import {SOLVED_STATUSES} from './Constants';

export default class SolvedStatusModal extends React.Component {

	constructor(props) {
        super(props);
        this.state = {
            selectedDropDownStatus: '',
            buttonDisabled: true
        };
		this.setValue = this.setValue.bind(this);
        this.updateSolvedStatus = this.updateSolvedStatus.bind(this);

    }
    setValue(event){

		this.setState({

			selectedDropDownStatus: event.target.value,
			buttonDisabled: event.target.value.length == 0 ? true : false
		});

	}
    updateSolvedStatus(){


        fetch(UPDATE_SOLVED_STATUS,{

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
				<FormGroup controlId="updateSolvedStatus" bsSize="sm">
					<ControlLabel>
						Update Solved status to 
					</ControlLabel>
					<FormControl bsSize="sm" componentClass="select" placeholder="select" onChange={this.setValue} value={this.state.selectedDropDownStatus}>
						<option value=""></option>
                        {SOLVED_STATUSES.map((proj,index) => <option key = {index} value={proj} >{proj}</option> )}
					</FormControl>
				</FormGroup>
			
			<Button disabled={this.state.buttonDisabled} onClick={this.updateSolvedStatus}>Submit</Button>
			</Form>
			

		);

	}

}
