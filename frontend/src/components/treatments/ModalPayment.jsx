import { useState } from "react";
import storeTreatments from "../../context/storeTreatments";
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

function ModalPayment({ treatment }) {

    const { toggleModal } = storeTreatments()
    const { payTreatments } = storeTreatments()
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);


    const handlePayment = async (e) => {
        e.preventDefault()

        setLoading(true)

        const cardElement = elements.getElement(CardElement);

        const { paymentMethod } = await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
        })

        const data ={
            paymentMethodId:paymentMethod.id,
            treatmentId: treatment._id,
            cantidad: Math.round(+treatment.precio * 100),
            motivo: treatment.descripcion,
        }
        payTreatments(data) 
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center">
            <div className="bg-gray-900 rounded-lg shadow-lg overflow-y-auto p-6 max-w-lg w-full border border-gray-700 relative">

                <p className="text-white font-bold text-xl mb-4">Pagar Tratamiento</p>

                <form onSubmit={handlePayment} className="space-y-6 p-6 rounded-lg shadow-md">
                    <div>
                        <label className="block text-sm font-semibold text-gray-200 text-left">Detalle</label>
                        <ul className="text-gray-400 bg-gray-700 p-2 rounded-md text-left">
                            <li>
                                Nombre: {treatment.nombre}
                            </li>
                            <li>
                                Descripción: {treatment.descripcion}
                            </li>
                            <li>
                                Prioridad: {treatment.prioridad}
                            </li>
                        </ul>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-200 text-left">Precio</label>
                        <p className="text-green-400 bg-gray-700 p-2 rounded-md font-bold text-left">$ {treatment.precio}</p>
                    </div>

                    <label className="block text-sm font-semibold text-gray-200 text-left m-0">Tarjeta de crédito</label>
                    <div className="p-3 border border-gray-600 rounded-lg bg-gray-700">
                        <CardElement options={{ style: { base: { fontSize: '16px', color: 'white' } } }} />
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white transition duration-300" 
                        disabled={loading}
                        >
                        {loading ? "Procesando...":"Pagar"}
                        </button>

                        <button type="button" className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-800 text-white transition duration-300" onClick={() => toggleModal()}>
                            Cancelar
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}

export default ModalPayment;
