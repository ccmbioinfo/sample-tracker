import React from "react";
import SampleDetailBox from "./SampleDetailBox";
import {Modal} from 'react-bootstrap';

export default class SampleLink extends React.Component{

    constructor(props){

        super(props);
        this.displaySampleBox = this.displaySampleBox.bind(this);
		this.closeModal = this.closeModal.bind(this);
        this.state = { show: false };

    }
    displaySampleBox(){
    
        this.setState({ show: true });


    }
	closeModal(){

	    this.setState({ show: false });

	}
    render(){

        return(

			<div>
			<Modal {...this.props} bsSize="large" aria-labelledby="Sample_history" show={this.state.show} onHide={this.closeModal}>
				<Modal.Header closeButton>
            				<Modal.Title id='Sample_history'>Sample history and details</Modal.Title>
          			</Modal.Header>
          			<Modal.Body>
					<SampleDetailBox sampleData={this.props.sampledetails} />
				</Modal.Body>
				</Modal>
                        <a href='#' onClick={this.displaySampleBox}>{this.props.sampledetails.Sample}</a>
			</div>
        );
    }
}
