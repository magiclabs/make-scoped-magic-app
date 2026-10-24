import Image from 'next/image';
import DevLinks from './DevLinks';

const Header = () => {
  return (
    <div className="app-header-container">
      <Image src="/logo.svg" alt="magic-logo" width={32} height={32} className="magic-logo" />
      <div className="text-center text-white text-xl font-extrabold font-['Inter'] leading-[30px]">Magic</div>
      <h3 className="demo-sub-header">Demo</h3>
      <DevLinks />
    </div>
  );
};

export default Header;
