export interface DistrictData {
  district: string;
  thanas: string[];
}

export const BANGLADESH_DISTRICTS: DistrictData[] = [
  {
    district: 'Dhaka',
    thanas: [
      'Adabor', 'Badda', 'Bangshal', 'Bimanbandar', 'Cantonment', 'Chawkbazar', 'Dakshinkhan', 
      'Darus Salam', 'Demra', 'Dhanmondi', 'Gendaria', 'Gulshan', 'Hazaribagh', 'Jatrabari', 
      'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon', 'Khilkhet', 'Kotwali', 
      'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'New Market', 'Pallabi', 'Paltan', 
      'Ramna', 'Rampura', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 'Sher-e-Bangla Nagar', 'Shyampur', 
      'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 'Turag', 'Uttara East', 'Uttara West', 
      'Vatara', 'Wari', 'Dhamrai', 'Dohar', 'Keraniganj', 'Nawabganj', 'Savar'
    ]
  },
  {
    district: 'Chattogram',
    thanas: ['Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 'Karnaphuli', 'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 'Sitakunda', 'Kotwali', 'Panchlaish', 'Pahartali', 'Halishahar', 'Khulshi', 'Bakalia', 'Bayazid', 'Patenga']
  },
  {
    district: 'Gazipur',
    thanas: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi']
  },
  {
    district: 'Narayanganj',
    thanas: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon', 'Fatullah', 'Siddhirganj']
  },
  {
    district: 'Sylhet',
    thanas: ['Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Sylhet Sadar', 'Zakiganj']
  },
  {
    district: 'Rajshahi',
    thanas: ['Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore', 'Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum']
  },
  {
    district: 'Khulna',
    thanas: ['Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada', 'Daulatpur', 'Khalishpur', 'Khan Jahan Ali', 'Kotwali', 'Sonadanga']
  },
  {
    district: 'Bogura',
    thanas: ['Adamdighi', 'Bogura Sadar', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola']
  },
  {
    district: 'Cumilla',
    thanas: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Cumilla Adarsha Sadar', 'Cumilla Sadar Dakshin', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Monohargonj', 'Muradnagar', 'Nangalkot', 'Titas']
  },
  {
    district: 'Barishal',
    thanas: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Barishal Sadar', 'Gournadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Kotwali']
  },
  {
    district: 'Mymensingh',
    thanas: ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gafargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Mymensingh Sadar', 'Muktagachha', 'Nandail', 'Phulpur', 'Tara Khanda']
  },
  {
    district: 'Faridpur',
    thanas: ['Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Faridpur Sadar', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha']
  },
  {
    district: 'Jashore',
    thanas: ['Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jashore Sadar', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha']
  },
  {
    district: 'Cox\'s Bazar',
    thanas: ['Chakaria', 'Cox\'s Bazar Sadar', 'Kutubdia', 'Maheshkhali', 'Pekua', 'Ramu', 'Teknaf', 'Ukhiya']
  },
  {
    district: 'Tangail',
    thanas: ['Basail', 'Bhuapur', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Tangail Sadar']
  },
  {
    district: 'Sirajganj',
    thanas: ['Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Sirajganj Sadar', 'Tarash', 'Ullahpara']
  },
  {
    district: 'Pabna',
    thanas: ['Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Pabna Sadar', 'Santhia', 'Sujanagar']
  },
  {
    district: 'Brahmanbaria',
    thanas: ['Akhaura', 'Ashuganj', 'Bancharampur', 'Brahmanbaria Sadar', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail', 'Bijoynagar']
  },
  {
    district: 'Kishoreganj',
    thanas: ['Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kishoreganj Sadar', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail']
  },
  {
    district: 'Feni',
    thanas: ['Chhagalnaiya', 'Daganbhuiyan', 'Feni Sadar', 'Fulgazi', 'Parshuram', 'Sonagazi']
  },
  {
    district: 'Noakhali',
    thanas: ['Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Noakhali Sadar', 'Senbagh', 'Sonaimuri', 'Subarnachar']
  },
  {
    district: 'Dinajpur',
    thanas: ['Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Dinajpur Sadar', 'Nawabganj', 'Parbatipur']
  },
  {
    district: 'Rangpur',
    thanas: ['Badarganj', 'Gangachhara', 'Kaunia', 'Rangpur Sadar', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj']
  },
  {
    district: 'Kushtia',
    thanas: ['Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Kushtia Sadar', 'Mirpur']
  }
];