import React from "react";
import SampleDetailBox from "./SampleDetailBox";
import { Modal } from 'react-bootstrap';

export default class SampleLink extends React.Component {
    constructor(props) {
        super(props);
        this.state = {show: false};
    }

    render() {
        return (
            <div>
                <Modal {...this.props} bsSize="large" aria-labelledby="Sample_history"
                       show={this.state.show}
                       onHide={() => this.setState({show: false})}>
                    <Modal.Header closeButton>
                        <Modal.Title id='Sample_history'>Sample history and details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <SampleDetailBox sampleData={this.props.sampledetails}/>
                    </Modal.Body>
                </Modal>
                <a href='#' onClick={e => {
                    e.preventDefault();
                    this.setState({show: true});
                }}>
                    {this.props.sampledetails.Sample}
                </a>
            </div>
        );
    }
}
