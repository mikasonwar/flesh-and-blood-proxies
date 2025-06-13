import { Component } from "preact";
import styled from "styled-components";


const CardDiv = styled.div`
  padding: 10px;
  display: flex;
  gap: 2px;
  flex-direction: column;
  img {
    max-width: 100%;
    ${props => {
      if (props.rotateImage) {
        return `
          transform: rotate(90deg) scale(1.3968) translate(24%);
        `;
      }
    }}

    @media print {
      border: dashed 2px black;
      height: 88mm;
      width: 63mm;
      max-width: unset;

      ${props => {
        if (props.rotateImage) {
          return `
            height: 63mm;
            width: 88mm;
          `
        } else {
          return `
            height: 88mm;
            width: 63mm;
          `
        }
      }}
    }
  }

  @media print {
    gap: 0;
    padding: 0;
  }
`

const AddButton = styled.button.attrs({ className: 'no-print btn btn-success'})`
  font-size: 18px;
`;

const RemoveButton = styled.button.attrs({ className: 'no-print btn btn-danger'})`
  font-size: 18px;
`

const ActionContainer = styled.div.attrs({ className: 'no-print' })`
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  gap: 5px;
`

const MoveButton = styled.button.attrs({ className: 'no-print btn btn-primary' })`
  padding: 10px;
`

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 329px;

  @media only screen and (max-width: 600px) {
    min-height: 488px !important;
  }
`;


export default class CardResult extends Component {
  constructor() {
    super()

    this.state = {
      printing: null,
      currentPrintingIdx: 0
    }
  }

  componentDidMount() {
    this.setDefaultPrinting();
  }

  componentDidUpdate(prevProps) {
    if(!prevProps) {
      return;
    }

    if(prevProps.card.unique_id != this.props.card.unique_id || prevProps.printing?.unique_id != this.props.printing?.unique_id) {
      this.setDefaultPrinting();
    }
  }

  setDefaultPrinting = () => {
    let currentPrinting = this.props.printing || this.props.card.printings[0];
    this.setState({
      printing: currentPrinting,
      currentPrintingIdx: this.props.card.printings.findIndex((printing) => currentPrinting.unique_id == printing.unique_id)
    });
  }

  selectNextPrint = () => {
    const { 
      card = {}, 
      chosenList = false,
      changeCardPrintingFromChosenCards = null,
      entryIndex = null,
    } = this.props;

    if (this.state.currentPrintingIdx >= card.printings.length - 1) {
      return;
    }

    if(chosenList) {
      if(entryIndex !== null) {
        changeCardPrintingFromChosenCards(entryIndex, card.printings[this.state.currentPrintingIdx + 1]);
      }
    } else {
      this.setState({
        printing: card.printings[this.state.currentPrintingIdx + 1],
        currentPrintingIdx: this.state.currentPrintingIdx + 1
      });
    }
  }

  selectPreviousPrint = () => {
    const { 
      card = {}, 
      chosenList = false,
      changeCardPrintingFromChosenCards = null,
      entryIndex = null,
    } = this.props;

    if (this.state.currentPrintingIdx <= 0) {
      return;
    }

    if(chosenList) {
      if(entryIndex !== null) {
        changeCardPrintingFromChosenCards(entryIndex, card.printings[this.state.currentPrintingIdx - 1]);
      }
    } else {
      this.setState({
        printing: card.printings[this.state.currentPrintingIdx - 1],
        currentPrintingIdx: this.state.currentPrintingIdx - 1 
      });
    }
  }

  render() {
    const { 
      card = {}, 
      chosenList = false
    } = this.props;

    const {
      printing
    } = this.state;

    if (printing == null) {
      return (
        <CardDiv>
          Loading...
        </CardDiv>
      )
    }

    let canGoToNextPrint = this.state.currentPrintingIdx < card.printings.length -1;
    let canGoToPreviousPrint = this.state.currentPrintingIdx > 0;

    let actionButton;
    if(chosenList) {
      actionButton = (<RemoveButton onClick={() => this.props.removeCardFromChosenCards(card, printing)}> Remove </RemoveButton>)
    } else {
      actionButton = (<AddButton onClick={() => this.props.addCardToChosenCards(card, printing)}> Add </AddButton>)
    }

    const rotateImage = card.played_horizontally && printing.image_rotation_degrees != 270 && printing.image_rotation_degrees != 90

    return (
      <CardDiv rotateImage={rotateImage}>
        <label class="no-print">{card.name}</label>
        <ImageWrapper>
          <img src={printing.image_url} alt={card.name} />
        </ImageWrapper>
        <label class="no-print">Printing #{this.state.currentPrintingIdx+1}</label>
        <ActionContainer>
          <MoveButton onClick={() => this.selectPreviousPrint()} disabled={!canGoToPreviousPrint}>
            {"<"}
          </MoveButton>
          {actionButton}
          <MoveButton onClick={() => this.selectNextPrint()} disabled={!canGoToNextPrint}>
            {">"}
          </MoveButton>
        </ActionContainer>
      </CardDiv>
    );
  }
}