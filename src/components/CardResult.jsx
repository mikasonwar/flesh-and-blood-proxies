import { Component } from "preact";
import styled from "styled-components";


const CardDiv = styled.div`
  padding: 6px;
  display: flex;
  gap: 5px;
  flex-direction: column;
  border-radius: 8px;
  background: linear-gradient(180deg, #fffdf7 0%, #fff7e3 100%);
  border: 1px solid rgba(173, 139, 58, 0.18);
`

const AddButton = styled.button.attrs({ className: 'btn btn-success'})`
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
`;

const RemoveButton = styled.button.attrs({ className: 'btn btn-danger'})`
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
`

const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 34px 1fr 34px;
  gap: 5px;
`

const MoveButton = styled.button.attrs({ className: 'btn btn-primary' })`
  padding: 0.35rem 0.2rem;
`

const ImageWrapper = styled.div`
  width: 100%;
  height: 100%;
  min-height: 188px;
  border-radius: 5px;
  overflow: hidden;
  background: #f7f1dd;

  img {
    display: block;
    width: 100%;
    max-width: 100%;
    ${props => {
      if (props.rotateImage) {
        return `
          transform: rotate(90deg) scale(1.3968) translate(24%);
        `;
      }
    }}
  }

  @media only screen and (max-width: 600px) {
    min-height: 250px;
  }
`;

const CardTitle = styled.label`
  color: #3d2f14;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
`;

const PrintingMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 6px;
  align-items: center;
  color: #6d624a;
  font-size: 0.7rem;
`;

const PrintingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.4rem;
  border-radius: 999px;
  background: #f4e1ac;
  color: #5b4516;
  font-weight: 600;
`;

const QuantityBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  background: #4b3511;
  color: #fff7df;
  font-weight: 700;
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
    } = this.props;

    if (this.state.currentPrintingIdx >= card.printings.length - 1) {
      return;
    }

    if(chosenList) {
      changeCardPrintingFromChosenCards(card.unique_id, card.printings[this.state.currentPrintingIdx + 1]);
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
    } = this.props;

    if (this.state.currentPrintingIdx <= 0) {
      return;
    }

    if(chosenList) {
      changeCardPrintingFromChosenCards(card.unique_id, card.printings[this.state.currentPrintingIdx - 1]);
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
      chosenList = false,
      quantity = 1,
      hasMixedPrintings = false,
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
      actionButton = (<RemoveButton onClick={() => this.props.removeCardFromChosenCards(card)}> Remove </RemoveButton>)
    } else {
      actionButton = (<AddButton onClick={() => this.props.addCardToChosenCards(card, printing)}> Add </AddButton>)
    }

    const rotateImage = card.played_horizontally && printing.image_rotation_degrees != 270 && printing.image_rotation_degrees != 90

    return (
      <CardDiv>
        <CardTitle>{card.name}</CardTitle>
        <ImageWrapper rotateImage={rotateImage}>
          <img src={printing.image_url} alt={card.name} />
        </ImageWrapper>
        <PrintingMeta>
          <span>{hasMixedPrintings ? 'Mixed printings' : `Printing #${this.state.currentPrintingIdx+1}`}</span>
          <div style="display:flex;gap:6px;align-items:center;">
            {chosenList && <QuantityBadge>x{quantity}</QuantityBadge>}
            <PrintingBadge>{card.printings.length} variants</PrintingBadge>
          </div>
        </PrintingMeta>
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
