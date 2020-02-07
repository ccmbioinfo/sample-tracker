import React from "react";
import Modal from "react-bootstrap/lib/Modal";
import FormGroup from "react-bootstrap/lib/FormGroup";
import ControlLabel from "react-bootstrap/lib/ControlLabel";
import FormControl from "react-bootstrap/lib/FormControl";
import Checkbox from "react-bootstrap/lib/Checkbox";
import Button from "react-bootstrap/lib/Button";
import Alert from "react-bootstrap/lib/Alert";


export default class CreateUserModal extends React.Component {
    constructor(props) {
        super(props);
        this.createState = this.createState.bind(this);
        this.submit = this.submit.bind(this);
        this.state = this.createState(props);
    }
    createState(props) {
        return {
            username: props.username || "",
            email: props.email || "",
            isAdmin: !!props.isAdmin,
            password: props.password || "",
            confirmPassword: props.confirmPassword || "",
            errorNoMatch: !!props.errorNoMatch,
            errorIntegrity: !!props.errorIntegrity
        };
    }
    submit(e) {
        e.preventDefault();
        fetch("/admin/users", {
            method: "PUT",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": document.getElementById("csrf_token").value
            },
            body: JSON.stringify(this.state)
        }).then(response => {
            if (response.ok) {
                this.props.onSuccess(this.state);
                this.setState(this.createState(this.props)); // reset to default
            } else {
                this.setState({
                    errorNoMatch: response.status === 400,
                    errorIntegrity: response.status !== 400
                });
            }
        });

    }
    render() {
        return (
          <Modal show={this.props.show} onHide={this.props.onHide}>
              <Modal.Header closeButton>
                  <Modal.Title>New user</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  {this.state.errorNoMatch && <Alert bsStyle="danger">Passwords do not match or length requirement not satisfied.</Alert>}
                  {this.state.errorIntegrity && <Alert bsStyle="danger">User or email already exists.</Alert>}
                  <form onSubmit={this.submit}>
                      <FormGroup>
                          <ControlLabel>Username</ControlLabel>
                          <FormControl
                              type="text" placeholder="minimum 4 characters" autoComplete="off" required
                              value={this.state.username}
                              onChange={e => this.setState({ username: e.target.value })}
                          />
                      </FormGroup>
                      <FormGroup>
                          <ControlLabel>Email</ControlLabel>
                          <FormControl
                              type="email" placeholder="somebody@sickkids.ca" autoComplete="off" required
                              value={this.state.email}
                              onChange={e => this.setState({ email: e.target.value })}
                          />
                      </FormGroup>
                      <Checkbox checked={this.state.isAdmin}
                                onChange={e => this.setState({ isAdmin: e.target.checked })}>
                          Admin?
                      </Checkbox>
                      <FormGroup>
                          <ControlLabel>Password (minimum 4 characters)</ControlLabel>
                          <FormControl
                              type="password" autoComplete="new-password" required
                              value={this.state.password}
                              onChange={e => this.setState({ password: e.target.value })}
                          />
                      </FormGroup>
                      <FormGroup>
                          <ControlLabel>Confirm password</ControlLabel>
                          <FormControl
                              type="password" autoComplete="new-password" required
                              value={this.state.confirmPassword}
                              onChange={e => this.setState({ confirmPassword: e.target.value })}
                          />
                      </FormGroup>
                      <Button bsStyle="primary" type="submit">Create</Button>
                  </form>
              </Modal.Body>
          </Modal>
        );
    }
}
