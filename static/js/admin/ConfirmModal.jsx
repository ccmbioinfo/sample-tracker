import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import Button from "react-bootstrap/lib/Button";

export default class ConfirmModal extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Header>
                    <Modal.Title>{this.props.children}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Button
                        bsStyle={this.props.confirmStyle}
                        onClick={this.props.onConfirm}>
                        Yes
                    </Button>
                    <Button
                        bsStyle="info" style={{float: "right"}}
                        onClick={this.props.onHide}>
                        No, go back
                    </Button>
                </Modal.Body>
            </Modal>
        )
    }
}
