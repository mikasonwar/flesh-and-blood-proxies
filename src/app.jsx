import { Component } from "preact";
import './app.css';
import cardsUrl from '/cards.json?url';
import CardList from './components/CardList';
import { exportProxyPdf } from './pdf/exportProxyPdf';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  align-items: start;
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
      isPreviewingPdf: false,
      exportError: '',
      pdfPreviewUrl: '',
    }
    this.timer = null;
  }

  componentWillUnmount() {
    if (this.state.pdfPreviewUrl) {
      URL.revokeObjectURL(this.state.pdfPreviewUrl);
    }
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

  removeCardFromChosenCards = (card) => {
    let removedOne = false;
    let result = this.state.chosenCards.filter((chosenCard) => {
      if (!removedOne && chosenCard.card.unique_id == card.unique_id) {
        removedOne = true;
        return false;
      }

      return true;
    });

    this.setState({ chosenCards: result });
  }

  changeCardPrintingFromChosenCards = (cardUniqueId, printing) => {
    let newList = this.state.chosenCards.map((entry) => {
      if (entry.card.unique_id == cardUniqueId) {
        return {
          ...entry,
          printing,
        };
      }

      return entry;
    });

    this.setState({ chosenCards: newList });
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

  previewChosenCardsPdf = async () => {
    if (this.state.chosenCards.length === 0 || this.state.isPreviewingPdf) {
      return;
    }

    this.setState({ isPreviewingPdf: true, exportError: '' });

    try {
      const pdfBlob = await exportProxyPdf(this.state.chosenCards);
      const nextUrl = URL.createObjectURL(pdfBlob);

      if (this.state.pdfPreviewUrl) {
        URL.revokeObjectURL(this.state.pdfPreviewUrl);
      }

      this.setState({
        pdfPreviewUrl: nextUrl,
      });
    } catch (error) {
      console.error(error);
      this.setState({
        exportError: 'PDF preview failed. The static image proxies could not fetch one or more card images.',
      });
    } finally {
      this.setState({ isPreviewingPdf: false });
    }
  }

  downloadPreviewPdf = () => {
    if (!this.state.pdfPreviewUrl) {
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const link = document.createElement('a');
    link.href = this.state.pdfPreviewUrl;
    link.download = `fab-proxies-${timestamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  closePdfPreview = () => {
    if (this.state.pdfPreviewUrl) {
      URL.revokeObjectURL(this.state.pdfPreviewUrl);
    }

    this.setState({ pdfPreviewUrl: '' });
  }

  render() {
    const {
      activeTab,
      searchResultCards,
      chosenCards,
      isPreviewingPdf,
      exportError,
      pdfPreviewUrl,
    } = this.state;

    return (<>
      <div class="app-shell">
        <section class="no-print control-panel">
          <div class="hero-block">
            <h1 class="project-title">Mikas&apos; Flesh &amp; Bluff Proxies 🩸🃏</h1>
          </div>

          <div class="tabs" role="tablist" aria-label="Card tools">
            <button
              class={`${ activeTab == 'search' ? 'active-tab' : ''}`}
              onClick={() => this.setState({activeTab: 'search'})}
            >
              Search cards
            </button>
            <button
              class={`${ activeTab == 'import' ? 'active-tab' : ''}`}
              onClick={() => this.setState({activeTab: 'import'})}
            >
              Import deck
            </button>
          </div>

          <div className="tab-content">
            <div class={`${ activeTab == 'search' ? 'active-tab' : ''} search-content-tab`}>
              <label for="card-search">Search for cards by name</label>
              <input
                name="card-search"
                type="search"
                onChange={(evt) => this.handleQueryChange(evt.target.value)}
              />
            </div>
            <div class={`${ activeTab == 'import' ? 'active-tab' : ''} import-content-tab`}>
              <label for="card-import">Paste a Fabrary list copied with “Copy card list to clipboard”</label>
              <textarea name="card-import"></textarea>
            </div>
          </div>

          <div class="toolbar-row">
            <button class="btn btn-primary" onClick={this.previewChosenCardsPdf} disabled={chosenCards.length === 0 || isPreviewingPdf}>
              {isPreviewingPdf ? 'Opening Preview...' : 'Preview PDF'}
            </button>
            <button class="btn btn-secondary" onClick={() => this.setState({ chosenCards: [] })}>Clear queue</button>
            { activeTab == 'import' && (
              <button
                class="btn btn-primary"
                onClick={() => this.importFromFabrary(document.querySelector('textarea[name="card-import"]').value)}
              >
                Import from Fabrary
              </button>
            )}
          </div>
          {exportError && <p class="export-error">{exportError}</p>}
        </section>

        <AppContainer>
          <div class="no-print panel-shell">
            <div class="panel-heading">
              <div>
                <h2>Available matches</h2>
              </div>
              <span class="panel-count">{searchResultCards.length}</span>
            </div>
            {(activeTab == 'search' && searchResultCards.length > 0 && <CardList cards={searchResultCards} chosenList={false} addCardToChosenCards={this.addCardToChosenCards} />)}
            {(activeTab == 'search' && searchResultCards.length === 0) && (
              <div class="empty-state">
                <h3>Start with a card name</h3>
                <p>Type at least three characters to surface matching cards from the local library.</p>
              </div>
            )}
            {(activeTab == 'import') && (
              <div class="empty-state import-state">
                <h3>Import mode is ready</h3>
                <p>Paste a deck list on the left, then use the import button to populate the print queue.</p>
              </div>
            )}
          </div>

          <div class={`panel-shell preview-shell ${ chosenCards.length > 0 ? '' : 'is-empty'}`}>
            <div class="panel-heading">
              <div>
                <h2>Print queue</h2>
              </div>
              <span class="panel-count accent">{chosenCards.length}</span>
            </div>
            {chosenCards.length > 0 ? (
              <CardList cards={chosenCards} chosenList={true} changeCardPrintingFromChosenCards={this.changeCardPrintingFromChosenCards} removeCardFromChosenCards={this.removeCardFromChosenCards} />
            ) : (
              <div class="empty-state preview-state">
                <h3>No cards queued yet</h3>
                <p>Add cards from search results or import a deck list to start building a printable sheet.</p>
              </div>
            )}
          </div>
        </AppContainer>
      </div>
      {pdfPreviewUrl && (
        <div class="pdf-preview-overlay">
          <div class="pdf-preview-shell">
            <div class="pdf-preview-bar">
              <strong>PDF Preview</strong>
              <div class="pdf-preview-actions">
                <button class="btn btn-primary" onClick={this.downloadPreviewPdf}>Download PDF</button>
                <a class="btn btn-secondary" href={pdfPreviewUrl} target="_blank" rel="noreferrer">Open in new tab</a>
                <button class="btn btn-secondary" onClick={this.closePdfPreview}>Close</button>
              </div>
            </div>
            <iframe class="pdf-preview-frame" src={pdfPreviewUrl} title="PDF preview"></iframe>
          </div>
        </div>
      )}
    </>);
  }
}
