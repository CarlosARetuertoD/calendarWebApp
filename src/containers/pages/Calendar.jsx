import 'react-big-calendar/lib/css/react-big-calendar.css';
import Navbar from "components/navigation/Navbar"
import Layout from "hocs/layouts/Layout"

import BigCalendar from 'components/calendar/BigCalendar';

const eventos = [
    // Letras con beneficiarios aleatorios y número único
    { title: '102341 - S/ 1200 (Pionier)', start: new Date(2025, 3, 1), end: new Date(2025, 3, 1), allDay: true, resource: { beneficiario: 'Pionier' }},
    { title: '202556 - S/ 1200 (Wrangler)', start: new Date(2025, 3, 2), end: new Date(2025, 3, 2), allDay: true, resource: { beneficiario: 'Wrangler' }},
    { title: '202556 - S/ 2200 (Wrangler)', start: new Date(2025, 3, 2), end: new Date(2025, 3, 2), allDay: true, resource: { beneficiario: 'Norton' }},
    { title: '202556 - S/ 2500 (Wrangler)', start: new Date(2025, 3, 2), end: new Date(2025, 3, 2), allDay: true, resource: { beneficiario: 'Pionier' }},
    { title: '301789 - S/ 1350 (Norton)', start: new Date(2025, 3, 3), end: new Date(2025, 3, 3), allDay: true, resource: { beneficiario: 'Norton' }},
    { title: '404123 - S/ 950 (Vowh)', start: new Date(2025, 3, 4), end: new Date(2025, 3, 4), allDay: true, resource: { beneficiario: 'Vowh' }},
    { title: '509331 - S/ 2100 (Metal)', start: new Date(2025, 3, 5), end: new Date(2025, 3, 5), allDay: true, resource: { beneficiario: 'Metal' }},
    { title: '102342 - S/ 1100 (Pionier)', start: new Date(2025, 3, 6), end: new Date(2025, 3, 6), allDay: true, resource: { beneficiario: 'Pionier' }},
    { title: '202557 - S/ 1600 (Wrangler)', start: new Date(2025, 3, 7), end: new Date(2025, 3, 7), allDay: true, resource: { beneficiario: 'Wrangler' }},
    { title: '301790 - S/ 1800 (Norton)', start: new Date(2025, 3, 8), end: new Date(2025, 3, 8), allDay: true, resource: { beneficiario: 'Norton' }},
    { title: '404124 - S/ 1250 (Vowh)', start: new Date(2025, 3, 9), end: new Date(2025, 3, 9), allDay: true, resource: { beneficiario: 'Vowh' }},
    { title: '509332 - S/ 1700 (Metal)', start: new Date(2025, 3, 10), end: new Date(2025, 3, 10), allDay: true, resource: { beneficiario: 'Metal' }},
    { title: '102343 - S/ 1400 (Pionier)', start: new Date(2025, 3, 11), end: new Date(2025, 3, 11), allDay: true, resource: { beneficiario: 'Pionier' }},
    { title: '202558 - S/ 1500 (Wrangler)', start: new Date(2025, 3, 12), end: new Date(2025, 3, 12), allDay: true, resource: { beneficiario: 'Wrangler' }},
    { title: '301791 - S/ 1300 (Norton)', start: new Date(2025, 3, 13), end: new Date(2025, 3, 13), allDay: true, resource: { beneficiario: 'Norton' }},
    { title: '404125 - S/ 1000 (Vowh)', start: new Date(2025, 3, 14), end: new Date(2025, 3, 14), allDay: true, resource: { beneficiario: 'Vowh' }},
    { title: '509333 - S/ 1900 (Metal)', start: new Date(2025, 3, 15), end: new Date(2025, 3, 15), allDay: true, resource: { beneficiario: 'Metal' }},
    { title: '102344 - S/ 950 (Pionier)', start: new Date(2025, 3, 16), end: new Date(2025, 3, 16), allDay: true, resource: { beneficiario: 'Pionier' }},
    { title: '202559 - S/ 1750 (Wrangler)', start: new Date(2025, 3, 17), end: new Date(2025, 3, 17), allDay: true, resource: { beneficiario: 'Wrangler' }},
    { title: '301792 - S/ 1600 (Norton)', start: new Date(2025, 3, 18), end: new Date(2025, 3, 18), allDay: true, resource: { beneficiario: 'Norton' }},
    { title: '404126 - S/ 800 (Vowh)', start: new Date(2025, 3, 19), end: new Date(2025, 3, 19), allDay: true, resource: { beneficiario: 'Vowh' }},
    { title: '509334 - S/ 2000 (Metal)', start: new Date(2025, 3, 20), end: new Date(2025, 3, 20), allDay: true, resource: { beneficiario: 'Metal' }},
    { title: '301792 - S/ 1600 (Norton)', start: new Date(2025, 3, 21), end: new Date(2025, 3, 21), allDay: true, resource: { beneficiario: 'Norton' }},
    // Pagos de préstamo
    { title: '500001 - S/ 3000 (Préstamo)', start: new Date(2025, 3, 3), end: new Date(2025, 3, 3), allDay: true, resource: { beneficiario: 'Préstamo' }},
    { title: '500002 - S/ 2800 (Préstamo)', start: new Date(2025, 3, 9), end: new Date(2025, 3, 9), allDay: true, resource: { beneficiario: 'Préstamo' }},
    { title: '500003 - S/ 2500 (Préstamo)', start: new Date(2025, 3, 15), end: new Date(2025, 3, 15), allDay: true, resource: { beneficiario: 'Préstamo' }},
    { title: '500004 - S/ 2700 (Préstamo)', start: new Date(2025, 3, 22), end: new Date(2025, 3, 22), allDay: true, resource: { beneficiario: 'Préstamo' }},
    { title: '500005 - S/ 2900 (Préstamo)', start: new Date(2025, 3, 28), end: new Date(2025, 3, 28), allDay: true, resource: { beneficiario: 'Préstamo' }},
  ];
  
function Calendar(){
    return(
        <Layout>
            <div className="p-6">
                <Navbar/>
            </div>
            <div className="p-6 pt-10">
                <BigCalendar
                    eventos={eventos}
                    altura={800}
                />
            </div>
        </Layout>
    )
}
export default Calendar