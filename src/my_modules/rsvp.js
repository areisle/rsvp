import React, { Component } from 'react';
import './rsvp.css';
import isEqual from 'lodash.isequal';
import {Collapse} from 'react-collapse';

//this is the id provided by weddingwire for the event
let event_id = process.env.EVENTID;

class RSVPApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: '',
      apellidos: '',
      searchResults: [],
      resultRSVPFormOpen: [],
      errors: '',
      message: '',
    };

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.toggleRSVPFormView = this.toggleRSVPFormView.bind(this);
    this.displayMessage = this.displayMessage.bind(this);
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  handleSearchChange(nameAndValue) {
    this.setState(nameAndValue);
  }

  handleSearch(e) {
    e.preventDefault();
    try {
      this.validateSearchForm();
      getMatches(this.state.nombre, this.state.apellidos).then(groups => {
        //displayMatches(groups);
        let results = removeDuplicates(groups);
        this.setState({
          searchResults: results,
          resultRSVPFormOpen: new Array(results.length).fill(false)
        });
      }).catch(error => {
        this.setState({
          errors: error,
        });
      });
    } catch (validation_errors){
      this.setState({
        errors: validation_errors,
      });
    }
  }

  toggleRSVPFormView(i) {
    let groupRSVPFormOpen = new Array(this.state.searchResults.length).fill(false);
    if (this.state.resultRSVPFormOpen[i] !== true) {
      groupRSVPFormOpen[i] = true;
    }
    this.setState({
      resultRSVPFormOpen: groupRSVPFormOpen,
    });
  }

  validateSearchForm() {
    this.setState({
      errors: ''
    });
    //get form values
    let first_name = this.state.nombre;
    let last_name = this.state.apellidos;
    //check if either field is empty
    //first name missing
    if (first_name === "" && last_name === "") throw new Error("no name entered");
    if (first_name === "") throw new Error("no first name entered");
    if (last_name === "") throw new Error("no last name entered");
  }

  displayMessage(message) {
    let result;
    if (message.message === null) {
      //success!
      result = "Success! you have RSVPed";
    } else {
      result = "there was an error submitting your RSVP, please try again";
    }
    this.setState({
      message: result,
    });
  }
  
  handleUpdate(index, group) {
    let results = this.state.searchResults;
    results[index] = group;
    this.setState({
      searchResults: results,
    });
  }
  
  render() {
    let results;
    if (this.state.message !== '') {
      //display message
      results = <p className="success">{this.state.message}</p>;
    } else if (this.state.errors !== '') {
      //display errors
      results = <Errors value={this.state.errors}></Errors>;
    } else {
      //display search results
      results = <SearchResults searchResults={this.state.searchResults} update={this.handleUpdate} rsvpFormOpen={this.state.resultRSVPFormOpen} toggle={this.toggleRSVPFormView} message={this.displayMessage}></SearchResults>;
    }
    return (
      <div className="RSVPApp mask flex">
        <h1>RSVP for Jane and John's Wedding</h1>
        <SearchBar handleChange={this.handleSearchChange} handleSearch={this.handleSearch}></SearchBar>
        {results}
      </div>
    );
  }
}

function Errors(props) {
  return (
    <p className="errors" style={props.style}>Error: {props.value.message}</p>
  );
}

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const name = event.target.name;
    this.props.handleChange({[name]: event.target.value});
  }

  render() {
    const nombre = this.props.nombre;
    const apellidos = this.props.apellidos;
    return (
      <form action="rsvp.html" method="post" className="form-style search-form" onSubmit={this.props.handleSearch}>
        <input type="hidden" name="toConfirm"/>
        <input type="hidden" name="idUser" value={event_id}/>
        <ul>
          <li>
            <label htmlFor="nombre">First Name</label>
            <input type="text" name="nombre" id="nombre" value={nombre} onChange={this.handleChange}/>
          </li>
          <li>
            <label htmlFor="apellidos">Last Name</label>
            <input type="text" name="apellidos" id="apellidos" value={apellidos} onChange={this.handleChange}/>
          </li>
          <li className='submit'>
          <input className='button' type="submit" value="SEARCH"/>
          </li>
        </ul>
      </form>
    );
  }
}

class SearchResults extends Component {

  constructor(props) {
    super(props);
    this.toggleRSVPFormView = this.toggleRSVPFormView.bind(this);
  }

  toggleRSVPFormView(i) {
    this.props.toggle(i);
  }

  render() {
    const listItems = this.props.searchResults.map((group, i) =>
        <Group message={this.props.message}
                key={i}
                index={i}
                groupInfo={group}
                display={this.props.rsvpFormOpen[i]}
                handleClick={(i) => this.toggleRSVPFormView(i)}
                update={this.props.update}>
        </Group>
    );
    return (
      <div className="form-style">
        <ul>{listItems}</ul>
      </div>
    );
  }
}

class Group extends Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    this.props.handleClick(this.props.index);
  }

  render() {
    let display = this.props.display;
    return (
      <li className="guest">
        <div className="groupName">
          <h3>{this.props.groupInfo.map(person => person.name).join(', ')}</h3>
          <button onClick={this.handleClick}>RSVP</button>
        </div>
        <RSVPForm group={this.props.groupInfo}
                  display={display}
                  handleSumbit={this.handleRSVP}
                  message={this.props.message}
                  update={this.props.update}
                  index={this.props.index}>
        </RSVPForm>
      </li>
    );
  }
}

class RSVPForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errors: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.sendRSVP = this.sendRSVP.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    //check that all guests have selected an option i.e. validate form
    //send RSVP request to API and pass info back up to main app
    try {
      this.props.group.forEach(guest => {
        if (Number(guest.status) === 0) throw new Error(`please select an option for ${guest.name}`);
      });
      this.setState({
        errors: '',
      })
      // form is valid, send rsvp
      this.sendRSVP();
    } catch (validation_error) {
      //display errors
      this.setState({
        errors: validation_error,
      })
    }

  }

  sendRSVP() {
    let idsAndStatuses = `idContacto=${this.props.group[0].id}&${this.props.group.map(person => `events[${person.id}]=${person.status}`).join('&')}&comentario`;
    let emails = this.props.group.filter(person => person.message !== '');
    emails = emails.map(person => `name: ${person.name} => email: ${person.message}`).join(', ');
    let data = `${idsAndStatuses}=${emails}`;
    console.log(data);
    let url = 'https://www.weddingwire.ca/website/website-AjaxRsvpLayerRun.php';
    let myFunc = function (response) {
      console.log(response);
      return JSON.parse(response);
    }
    sendRequest('POST', url, data, myFunc).then(this.props.message).catch(this.props.message);
  }

  handleChange(index, status) {
    let info = this.props.group;
    info[index].status = status;
    this.props.update(this.props.index, info);
  }
  
  handleEmail(index, value) {
    let group = this.props.group;
    group[index].message = value;
    this.props.update(this.props.index, group);
    console.log(this.props.group);
  }
  
  render() {
    const listItems = this.props.group.map((guest, index) =>
      <li key={guest.id} className="radio">
        <p>{guest.name}</p>
        <input type="radio"
                id={"accept" + guest.id}
                name={"accept" + guest.id}
                value="1"
                checked={(Number(guest.status) === 1)}
                onChange={() => this.handleChange(index, 1)}
                />
        <label htmlFor={"accept" + guest.id}>Accept</label>
        <input type="radio"
                id={"decline" + guest.id}
                name={"decline" + guest.id}
                value="2"
                checked={(Number(guest.status) === 2)}
                onChange={() => this.handleChange(index, 2)}
                />
        <label htmlFor={"decline" + guest.id}>Decline</label>
        <label htmlFor="email">want to get updates about any changes? leave us your email</label>
        <input name="email" type="email" onChange={(event) => this.handleEmail(index, event.target.value)}/>
      </li>
    );
    let display = (this.state.errors === '') ? 'none': 'block';
    return (
      <Collapse isOpened={this.props.display}>
        <Errors value={this.state.errors} style={{'display': display}}></Errors>
        <form action="rsvp.html" method="POST" onSubmit={this.handleSubmit}>
          <ul>
            {listItems}
            <li className='submit'>
              <button type="submit">Submit</button>
            </li>
            
          </ul>
        </form>
      </Collapse>
    );
  }
}

function sendRequest(method, url, data, myFunc, ...args) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        try {
          resolve(myFunc(xhr.response, ...args));
        } catch(myerrors) {
          reject(myerrors);
        }
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(data);
  });
}

function getMatches(first_name, last_name) {
  let url = 'https://www.weddingwire.ca/website/website-AjaxRsvpRun.php';
  let data = `idUser=${event_id}&nombre=${first_name}&apellidos=${last_name}&toConfirm`;
  let myFunc = function (response) {
    let div = document.createElement('div');
    div.innerHTML = JSON.parse(response)["html"];
    let listitems = div.querySelectorAll('li');
    if (listitems.length===0) {
      //no matches
      throw new Error('We have found 0 guests matching that input');
    }
    let contactids = [];
    listitems.forEach(item => {
      contactids.push(item.dataset.idContacto);
    });
    return getGroupsFromIds(contactids);
  }
  return sendRequest("POST", url, data, myFunc);
}

function getGroupsFromIds(ids) {
  const url = 'https://www.weddingwire.ca/website/website-AjaxRsvpLayer.php';
  return Promise.all(ids.map((id) => getGroupFromId("POST", url, id))).then((allstuff) => {
    return removeDuplicates(allstuff);
  });
}

function getGroupFromId(method, url, id) {
  let myFunc = function (response) {
    let div = document.createElement('div');
    div.innerHTML = response;
    //get names from response html
    let groupInfo = [];
    let nameNodes = [...div.querySelectorAll('p')];
    let person;
    nameNodes.forEach((nameNode, index) => {
      if (index % 4 === 0) {
        if (index !== 0) {
          groupInfo.push(person);
        }
        person = {};
        //start new person
        person.name = nameNode.innerHTML.trim();
      } else {
        if (index %4 === 1) {
          person.id = nameNode.firstElementChild.name.match(/events\[(\d+)\]/)[1];
        }
        if (nameNode.firstElementChild.checked === true) {
          person.status = nameNode.firstElementChild.value;
        }
      }
    });
    person.message = '';
    groupInfo.push(person);
    return groupInfo;
  }
  return sendRequest(method, url, `idContacto=${id}`, myFunc);
}

function removeDuplicates(groups) {
  let groupsNoDupes = [];
  groups.forEach(group => {
    let isDupe = false;
    groupsNoDupes.forEach(groupNoDupes => {
      if (isEqual(groupNoDupes, group)) {
        isDupe = true;
      }
    });
    if (!isDupe) groupsNoDupes.push(group);
  });
  return groupsNoDupes;
}

export default RSVPApp;
