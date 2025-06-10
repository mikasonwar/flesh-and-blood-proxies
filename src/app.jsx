import { Component } from "preact";
import preactLogo from './assets/preact.svg';
import viteLogo from '/vite.svg';
import './app.css';
import cardsUrl from '/cards.json?url';
import CardList from './components/CardList';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  > * {
    width: 100%;
  }

  @media only screen and (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;


export default class App extends Component {
  constructor() {
    super()

    this.state = {
      cards: null,
      query: '',
      searchResultCards: [],
      chosenCards: [],
      activeTab: 'search',
    }
  }

  componentWillMount() {
    this.timer = null;
  }

  componentDidMount() {
    fetch(cardsUrl).then(res => res.json())
      .then((data) => {
        console.log(data);
        this.setState({ cards: data });
      })
  }

  handleQueryChange(value) {
    clearTimeout(this.timer);
    this.setState({ query: value });
    this.timer = setTimeout(this.triggerQueryChange.bind(this), 500);
  }

  triggerQueryChange() {
    this.searchCards(this.state.query);
  }

  searchCards = (name) => {
    name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (name.length < 3) {
      this.setState({ searchResultCards: [] });
      return;
    }

    let foundCards = this.state.cards.filter((card) => card.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(name));

    console.log(foundCards)
    this.setState({ searchResultCards: [...foundCards] });
  }

  addCardToChosenCards = (card, printing) => {
    let newChosenCards = [...this.state.chosenCards, { card: card, printing: printing }];
    console.log(newChosenCards);

    this.setState({ chosenCards: newChosenCards });
  }

  removeCardFromChosenCards = (card, printing) => {
    let idx = this.state.chosenCards.findIndex(chosenCard => chosenCard.card.unique_id == card.unique_id && chosenCard.printing.unique_id == printing.unique_id);
    let result = [...this.state.chosenCards];
    result.splice(idx, 1);

    this.setState({ chosenCards: result });
  }

  importFromFabrary = (list) => {
    let cards = list.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("Hero:", "1x").split('\n');
    let firstRegex = /^\d{1,2}x /;

    cards = cards.filter(card => firstRegex.test(card));
    console.log(cards);
    let cardRegex = /^(\d{1,2})x ([^\(\)]*)(\(\w*\))?$/;
    let cardNames = cards.map(card => cardRegex.exec(card)[2].trim());

    let searchedCards = this.state.cards.filter(card => cardNames.includes(card.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    let finalCards = [];
    let pitchConverter = {
      "": "",
      "(red)": "1",
      "(yellow)": "2",
      "(blue)": "3",
    }
    cards.forEach((card) => {
      let groups = cardRegex.exec(card);
      let number = +groups[1].trim().replace("x", "");
      let name = groups[2].trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      let pitch = pitchConverter[groups[3]];
      let chosenCard = searchedCards.find((card) => card.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "") == name && (!pitch || card.pitch == pitch));
      if(chosenCard) {
        for (let idx = 0; idx < number; idx++) {
          finalCards.push({ card: chosenCard, printing: chosenCard.printings[chosenCard.printings.length - 1] });
        }
      } else {
        console.error("No card found", card, number, name, pitch);
      }
    });

    this.setState({chosenCards: [...this.state.chosenCards, ...finalCards]});
  }

  render() {
    return (<>
      <div class="no-print top-menu">
        <h1 class="project-title">Mikas' Flesh & Blood Proxy Generator </h1>
        <div class="tabs">
          <div class={`${ this.state.activeTab == 'search' ? 'active-tab' : ''}`} onClick={() => this.setState({activeTab: 'search'})}>
            Search
          </div>
          <div class={`${ this.state.activeTab == 'import' ? 'active-tab' : ''}`} onClick={() => this.setState({activeTab: 'import'})}>
            Import
          </div>
        </div>

        <div className="tab-content">
          <div class={`${ this.state.activeTab == 'search' ? 'active-tab' : ''} search-content-tab`}>
            <label for="card-search">Search for cards by name:</label>
            <input name="card-search" type="search" onChange={(evt) => this.handleQueryChange(evt.target.value)} />
          </div>
          <div class={`${ this.state.activeTab == 'import' ? 'active-tab' : ''} import-content-tab`}>
            <label for="card-import">You can import your fabrary deck using "Copy card list to clipboard" and pasting it here.</label>
            <textarea name="card-import"></textarea>
          </div>
        </div>
        <div style="display: flex; gap:10px;justify-content:center;">
          <button class="btn btn-primary" onClick={() => window.print()}>Print</button>
          <button class="btn btn-primary" onClick={() => this.setState({ chosenCards: [] })}>Clear</button>
          { this.state.activeTab == 'import' && (<button class="btn btn-primary" onClick={() => this.importFromFabrary(document.querySelector('textarea[name="card-import"]').value)}>import from fabrary</button>) }
        </div>
      </div>
      <AppContainer>
        <div class="no-print" style={`${ this.state.searchResultCards.length > 0 ? '' : 'display:none;'}`}>
          {(this.state.activeTab == 'search' && <CardList cards={this.state.searchResultCards} chosenList={false} addCardToChosenCards={this.addCardToChosenCards} />)}
        </div>
        <div style={`${ this.state.chosenCards.length > 0 ? '' : 'display:none;'}`}>
          <CardList cards={this.state.chosenCards} chosenList={true} removeCardFromChosenCards={this.removeCardFromChosenCards} />
        </div>
      </AppContainer>
    </>);
  }
}
