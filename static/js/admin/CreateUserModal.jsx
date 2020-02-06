import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Button from "react-bootstrap/lib/Button";


export default class CreateUserModal extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
          <Modal show={this.props.show} onHide={this.props.onHide}>
              <Modal.Header closeButton>
                  <Modal.Title>New user</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <form>
                      <FormGroup>
                          <ControlLabel>Username</ControlLabel>
                          <FormControl type="text" placeholder="minimum 4 characters" autoComplete="off" />
                      </FormGroup>
                      <FormGroup>
                          <ControlLabel>Email</ControlLabel>
                          <FormControl type="email" placeholder="somebody@sickkids.ca" autoComplete="off" />
                      </FormGroup>
                      <Checkbox defaultChecked={false}>Admin?</Checkbox>
                      <FormGroup>
                          <ControlLabel>Password (minimum 4 characters)</ControlLabel>
                          <FormControl type="password" autoComplete="new-password" />
                      </FormGroup>
                      <FormGroup>
                          <ControlLabel>Confirm password</ControlLabel>
                          <FormControl type="password" autoComplete="new-password" />
                      </FormGroup>
                      <Button bsStyle="primary" type="submit">Create</Button>
                  </form>
              </Modal.Body>
          </Modal>
        );
    }
}
